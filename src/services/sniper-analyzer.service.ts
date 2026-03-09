import {
  CriteriaMatchResult,
  FakeAnalysis,
  FakeRiskLevel,
  ListingRecord,
  PriceAnalysis,
  SearchCriteria,
  SniperAnalysisResult,
  SniperDecision,
} from "../../shared/sniper-types";

const SUSPICIOUS_TEXT_PATTERNS = [
  "nur ueberweisung",
  "paypal freunde",
  "schnell weg",
  "nur heute",
  "kein treffen",
  "nur versand",
  "dringend",
  "familienverkauf",
  "ohne ruecknahme",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function includesNormalized(text: string, keyword: string): boolean {
  return text.includes(keyword.trim().toLowerCase());
}

function asSearchText(listing: ListingRecord): string {
  return [
    listing.title,
    listing.description ?? "",
    listing.category ?? "",
    listing.condition ?? "",
    listing.brand ?? "",
    listing.model ?? "",
    listing.location ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export class SniperAnalyzerService {
  analyze(
    listing: ListingRecord,
    criteria: SearchCriteria = {}
  ): SniperAnalysisResult {
    const startedAt = Date.now();
    const criteriaMatch = this.evaluateCriteria(listing, criteria);
    const priceAnalysis = this.evaluatePrice(listing, criteria);
    const fakeAnalysis = this.evaluateFakeScore(listing, criteria, priceAnalysis);
    const decision = this.buildDecision(
      criteriaMatch,
      priceAnalysis,
      fakeAnalysis,
      criteria
    );

    return {
      criteriaMatch,
      priceAnalysis,
      fakeAnalysis,
      decision,
      processingLatencyMs: Date.now() - startedAt,
    };
  }

  private evaluateCriteria(
    listing: ListingRecord,
    criteria: SearchCriteria
  ): CriteriaMatchResult {
    const matchedRules: string[] = [];
    const failedRules: string[] = [];
    const searchableText = asSearchText(listing);

    if (criteria.categories && criteria.categories.length > 0) {
      const category = (listing.category ?? "").toLowerCase();
      const categoryMatched = criteria.categories.some((entry) =>
        category.includes(entry.toLowerCase())
      );

      if (categoryMatched) {
        matchedRules.push("category_match");
      } else {
        failedRules.push("category_mismatch");
      }
    }

    if (criteria.priceMin !== undefined || criteria.priceMax !== undefined) {
      if (listing.price === null) {
        failedRules.push("price_missing");
      } else {
        if (criteria.priceMin !== undefined && listing.price < criteria.priceMin) {
          failedRules.push("below_min_budget");
        } else if (criteria.priceMin !== undefined) {
          matchedRules.push("above_min_budget");
        }

        if (criteria.priceMax !== undefined && listing.price > criteria.priceMax) {
          failedRules.push("above_max_budget");
        } else if (criteria.priceMax !== undefined) {
          matchedRules.push("within_max_budget");
        }
      }
    }

    if (criteria.allowNegotiable === false && listing.priceType === "NEGOTIABLE") {
      failedRules.push("negotiable_not_allowed");
    } else if (listing.priceType === "NEGOTIABLE") {
      matchedRules.push("negotiable_price");
    }

    if (criteria.allowFixedPrice === false && listing.priceType === "FIXED") {
      failedRules.push("fixed_price_not_allowed");
    } else if (listing.priceType === "FIXED") {
      matchedRules.push("fixed_price");
    }

    if (criteria.radiusKm !== undefined) {
      if (listing.distanceKm === undefined) {
        failedRules.push("distance_missing");
      } else if (listing.distanceKm > criteria.radiusKm) {
        failedRules.push("outside_radius");
      } else {
        matchedRules.push("within_radius");
      }
    }

    if (criteria.keywordsInclude && criteria.keywordsInclude.length > 0) {
      const missingKeywords = criteria.keywordsInclude.filter(
        (keyword) => !includesNormalized(searchableText, keyword)
      );

      if (missingKeywords.length > 0) {
        failedRules.push(`missing_keywords:${missingKeywords.join(",")}`);
      } else {
        matchedRules.push("include_keywords_match");
      }
    }

    if (criteria.keywordsExclude && criteria.keywordsExclude.length > 0) {
      const blockedKeywords = criteria.keywordsExclude.filter((keyword) =>
        includesNormalized(searchableText, keyword)
      );

      if (blockedKeywords.length > 0) {
        failedRules.push(`blocked_keywords:${blockedKeywords.join(",")}`);
      } else {
        matchedRules.push("exclude_keywords_clear");
      }
    }

    if (criteria.conditionKeywords && criteria.conditionKeywords.length > 0) {
      const conditionMatched = criteria.conditionKeywords.some((keyword) =>
        includesNormalized(searchableText, keyword)
      );

      if (conditionMatched) {
        matchedRules.push("condition_match");
      } else {
        failedRules.push("condition_mismatch");
      }
    }

    if (criteria.brands && criteria.brands.length > 0) {
      const brandText = `${listing.brand ?? ""} ${listing.title}`.toLowerCase();
      const brandMatched = criteria.brands.some((brand) =>
        includesNormalized(brandText, brand)
      );

      if (brandMatched) {
        matchedRules.push("brand_match");
      } else {
        failedRules.push("brand_mismatch");
      }
    }

    if (criteria.models && criteria.models.length > 0) {
      const modelText = `${listing.model ?? ""} ${listing.title}`.toLowerCase();
      const modelMatched = criteria.models.some((model) =>
        includesNormalized(modelText, model)
      );

      if (modelMatched) {
        matchedRules.push("model_match");
      } else {
        failedRules.push("model_mismatch");
      }
    }

    return {
      matched: failedRules.length === 0,
      matchedRules,
      failedRules,
    };
  }

  private evaluatePrice(
    listing: ListingRecord,
    criteria: SearchCriteria
  ): PriceAnalysis {
    const notes: string[] = [];
    const price = listing.price;
    const estimatedMarketValue =
      listing.estimatedMarketValue ?? criteria.marketReferencePrice;
    const budgetFit =
      price !== null &&
      (criteria.priceMin === undefined || price >= criteria.priceMin) &&
      (criteria.priceMax === undefined || price <= criteria.priceMax);
    const belowMarket =
      price !== null &&
      estimatedMarketValue !== undefined &&
      price <= estimatedMarketValue * 0.85;
    const negotiationPotential = listing.priceType === "NEGOTIABLE";
    let dealScore = 45;
    let suggestedOfferPrice: number | undefined;

    if (price === null) {
      notes.push("Preis fehlt im Listing.");
      dealScore -= 15;
    } else {
      if (budgetFit) {
        notes.push("Preis liegt im Budget.");
        dealScore += 20;
      } else if (
        criteria.priceMax !== undefined &&
        negotiationPotential &&
        price <= criteria.priceMax * 1.15
      ) {
        suggestedOfferPrice = Math.round(criteria.priceMax);
        notes.push(
          `Preis ist ueber Budget, aber mit Verhandlung waeren ${suggestedOfferPrice} EUR realistisch.`
        );
        dealScore += 8;
      } else if (criteria.priceMax !== undefined && price > criteria.priceMax) {
        notes.push("Preis liegt ueber dem gesetzten Budget.");
        dealScore -= 18;
      }

      if (belowMarket) {
        notes.push("Preis liegt deutlich unter dem erwarteten Marktwert.");
        dealScore += 22;
      } else if (
        estimatedMarketValue !== undefined &&
        price <= estimatedMarketValue
      ) {
        notes.push("Preis liegt unter oder auf dem Referenzmarktwert.");
        dealScore += 10;
      }

      if (negotiationPotential) {
        notes.push("VB-Preis erlaubt eine Verhandlungsstrategie.");
        dealScore += 10;
      }
    }

    dealScore = clamp(dealScore, 0, 100);

    const result: PriceAnalysis = {
      budgetFit,
      belowMarket,
      negotiationPotential,
      dealScore,
      notes,
    };

    if (estimatedMarketValue !== undefined) {
      result.estimatedMarketValue = estimatedMarketValue;
    }

    if (suggestedOfferPrice !== undefined) {
      result.suggestedOfferPrice = suggestedOfferPrice;
    }

    return result;
  }

  private evaluateFakeScore(
    listing: ListingRecord,
    criteria: SearchCriteria,
    priceAnalysis: PriceAnalysis
  ): FakeAnalysis {
    const reasons: string[] = [];
    const flags: string[] = [];
    let fakeScore = 0;
    const description = (listing.description ?? "").toLowerCase();
    const seller = listing.seller;
    const imageCount = listing.images.length;

    if (seller?.profileAgeDays !== undefined) {
      if (seller.profileAgeDays < 7) {
        fakeScore += 28;
        reasons.push("Verkaeuferprofil ist sehr neu.");
        flags.push("new_account");
      } else if (seller.profileAgeDays < 30) {
        fakeScore += 16;
        reasons.push("Verkaeuferprofil ist noch relativ neu.");
        flags.push("young_account");
      }
    }

    if (seller?.ratingCount !== undefined) {
      if (seller.ratingCount === 0) {
        fakeScore += 14;
        reasons.push("Keine Bewertungen vorhanden.");
        flags.push("no_ratings");
      } else if (seller.ratingCount < 3) {
        fakeScore += 8;
        reasons.push("Nur sehr wenige Bewertungen vorhanden.");
        flags.push("low_ratings");
      } else if (seller.ratingCount > 20) {
        fakeScore -= 8;
      }
    }

    if (seller?.isVerified) {
      fakeScore -= 10;
    }

    if (
      listing.price !== null &&
      priceAnalysis.estimatedMarketValue !== undefined &&
      listing.price <= priceAnalysis.estimatedMarketValue * 0.55
    ) {
      fakeScore += 24;
      reasons.push("Preis liegt extrem unter dem Referenzwert.");
      flags.push("extreme_price_outlier");
    } else if (
      listing.price !== null &&
      priceAnalysis.estimatedMarketValue !== undefined &&
      listing.price <= priceAnalysis.estimatedMarketValue * 0.7
    ) {
      fakeScore += 12;
      reasons.push("Preis ist deutlich niedriger als der Referenzwert.");
      flags.push("price_outlier");
    }

    const suspiciousMatches = SUSPICIOUS_TEXT_PATTERNS.filter((pattern) =>
      description.includes(pattern)
    );

    if (suspiciousMatches.length > 0) {
      fakeScore += Math.min(24, suspiciousMatches.length * 8);
      reasons.push(
        `Verdaechtige Beschreibungsmuster: ${suspiciousMatches.join(", ")}.`
      );
      flags.push("suspicious_description");
    }

    if (imageCount === 0) {
      fakeScore += 20;
      reasons.push("Keine Bilder vorhanden.");
      flags.push("no_images");
    } else if (imageCount === 1) {
      fakeScore += 10;
      reasons.push("Nur ein Bild vorhanden.");
      flags.push("low_image_count");
    }

    const reusedImages = listing.images.filter((image) => image.isReused).length;
    if (reusedImages > 0) {
      fakeScore += 20;
      reasons.push("Mindestens ein Bild wirkt wiederverwendet.");
      flags.push("reused_images");
    }

    const blurryImages = listing.images.filter(
      (image) => image.clarityScore !== undefined && image.clarityScore < 0.45
    ).length;
    if (blurryImages > 0) {
      fakeScore += 8;
      reasons.push("Mindestens ein Bild ist qualitativ schwach.");
      flags.push("unclear_images");
    }

    if (!listing.sellerName && !seller?.name) {
      fakeScore += 5;
      reasons.push("Keine klaren Verkaeuferinformationen vorhanden.");
      flags.push("missing_seller_info");
    }

    fakeScore = clamp(fakeScore, 0, 100);

    let riskLevel: FakeRiskLevel = "low";
    if (fakeScore >= 70) {
      riskLevel = "high";
    } else if (fakeScore >= 40) {
      riskLevel = "medium";
    }

    if (criteria.maxFakeScore !== undefined && fakeScore > criteria.maxFakeScore) {
      reasons.push("Listing liegt ueber dem maximal erlaubten Fake-Score.");
      flags.push("over_fake_threshold");
    }

    return {
      fakeScore,
      riskLevel,
      reasons,
      flags,
    };
  }

  private buildDecision(
    criteriaMatch: CriteriaMatchResult,
    priceAnalysis: PriceAnalysis,
    fakeAnalysis: FakeAnalysis,
    criteria: SearchCriteria
  ): SniperDecision {
    const maxFakeScore = criteria.maxFakeScore ?? 45;
    const minDealScore = criteria.minDealScore ?? 60;

    if (!criteriaMatch.matched) {
      return {
        shouldStore: false,
        shouldGenerateMessage: false,
        shouldSendAutomatically: false,
        mode: "reject",
        reason: "Listing erfuellt die Suchkriterien nicht.",
      };
    }

    if (fakeAnalysis.fakeScore > maxFakeScore || fakeAnalysis.riskLevel === "high") {
      return {
        shouldStore: true,
        shouldGenerateMessage: false,
        shouldSendAutomatically: false,
        mode: "reject",
        reason: "Listing wirkt zu riskant fuer eine automatische Aktion.",
      };
    }

    if (priceAnalysis.dealScore < minDealScore) {
      return {
        shouldStore: true,
        shouldGenerateMessage: true,
        shouldSendAutomatically: false,
        mode: "manual_review",
        reason: "Listing passt grundsaetzlich, braucht aber manuelle Preispruefung.",
      };
    }

    if (criteria.requireManualApproval) {
      return {
        shouldStore: true,
        shouldGenerateMessage: true,
        shouldSendAutomatically: false,
        mode: "manual_review",
        reason: "Manuelle Freigabe ist fuer diese Suche aktiviert.",
      };
    }

    return {
      shouldStore: true,
      shouldGenerateMessage: true,
      shouldSendAutomatically: true,
      mode: "auto_send",
      reason: "Listing passt zu den Kriterien und kann automatisch verarbeitet werden.",
    };
  }
}
