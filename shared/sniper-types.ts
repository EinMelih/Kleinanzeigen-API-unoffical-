export type PlatformName = "kleinanzeigen";
export type ListingPriceType = "FIXED" | "NEGOTIABLE" | "UNKNOWN";
export type FakeRiskLevel = "low" | "medium" | "high";
export type SniperDecisionMode = "auto_send" | "manual_review" | "reject";
export type MessageTone = "friendly" | "direct" | "careful";

export interface ListingImageRecord {
  url: string;
  hash?: string;
  isReused?: boolean;
  clarityScore?: number;
}

export interface SellerProfileRecord {
  id?: string;
  name?: string;
  isVerified?: boolean;
  ratingCount?: number;
  profileAgeDays?: number;
  profileCreatedAt?: string;
  responseRate?: number;
  responseTimeText?: string;
  activeListings?: number;
  profileUrl?: string;
}

export interface ListingRecord {
  id: string;
  externalId?: string;
  platform: PlatformName;
  title: string;
  description?: string;
  price: number | null;
  priceText?: string;
  priceType: ListingPriceType;
  category?: string;
  url: string;
  images: ListingImageRecord[];
  sellerName?: string;
  seller?: SellerProfileRecord;
  location?: string;
  distanceKm?: number;
  createdAt?: string;
  condition?: string;
  brand?: string;
  model?: string;
  estimatedMarketValue?: number;
}

export interface SearchCriteria {
  userId?: string;
  name?: string;
  categories?: string[];
  priceMin?: number;
  priceMax?: number;
  allowNegotiable?: boolean;
  allowFixedPrice?: boolean;
  radiusKm?: number;
  keywordsInclude?: string[];
  keywordsExclude?: string[];
  conditionKeywords?: string[];
  brands?: string[];
  models?: string[];
  marketReferencePrice?: number;
  maxFakeScore?: number;
  minDealScore?: number;
  requireManualApproval?: boolean;
  pickupRadiusKm?: number;
}

export interface CriteriaMatchResult {
  matched: boolean;
  matchedRules: string[];
  failedRules: string[];
}

export interface PriceAnalysis {
  budgetFit: boolean;
  belowMarket: boolean;
  negotiationPotential: boolean;
  dealScore: number;
  estimatedMarketValue?: number;
  suggestedOfferPrice?: number;
  notes: string[];
}

export interface FakeAnalysis {
  fakeScore: number;
  riskLevel: FakeRiskLevel;
  reasons: string[];
  flags: string[];
}

export interface MessageGenerationOptions {
  buyerName?: string;
  tone?: MessageTone;
  includePickupMention?: boolean;
  includePaypalMention?: boolean;
}

export interface MessageDraft {
  text: string;
  tone: MessageTone;
  containsPickup: boolean;
  containsPaypal: boolean;
  personalizedWithSeller: boolean;
}

export interface SniperDecision {
  shouldStore: boolean;
  shouldGenerateMessage: boolean;
  shouldSendAutomatically: boolean;
  mode: SniperDecisionMode;
  reason: string;
}

export interface SniperAnalysisResult {
  criteriaMatch: CriteriaMatchResult;
  priceAnalysis: PriceAnalysis;
  fakeAnalysis: FakeAnalysis;
  decision: SniperDecision;
  processingLatencyMs: number;
}
