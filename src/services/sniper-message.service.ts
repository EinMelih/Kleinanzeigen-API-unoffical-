import {
  ListingRecord,
  MessageDraft,
  MessageGenerationOptions,
  MessageTone,
  PriceAnalysis,
  SearchCriteria,
} from "../../shared/sniper-types";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim();
}

function formatMoney(value: number): string {
  return `${Math.round(value)} EUR`;
}

export class SniperMessageService {
  generateMessage(
    listing: ListingRecord,
    criteria: SearchCriteria = {},
    priceAnalysis?: PriceAnalysis,
    options: MessageGenerationOptions = {}
  ): MessageDraft {
    const tone: MessageTone = options.tone ?? "friendly";
    const sellerName = listing.seller?.name ?? listing.sellerName;
    const greeting = sellerName
      ? `Hallo ${firstName(sellerName)},`
      : "Hallo,";
    const title = listing.title || "der Artikel";
    const includePickup =
      options.includePickupMention ??
      (criteria.pickupRadiusKm !== undefined &&
        listing.distanceKm !== undefined &&
        listing.distanceKm <= criteria.pickupRadiusKm);
    const includePaypal = options.includePaypalMention ?? true;
    const lines: string[] = [greeting];

    if (tone === "direct") {
      lines.push(
        `ich habe gerade Ihre Anzeige für "${title}" gesehen und habe direkt Interesse.`
      );
    } else if (tone === "careful") {
      lines.push(
        `ich habe Ihre Anzeige für "${title}" gesehen und würde den Artikel gerne näher anschauen.`
      );
    } else {
      lines.push(
        `ich habe gerade Ihre Anzeige für "${title}" gesehen und habe Interesse an dem Artikel.`
      );
    }

    lines.push("Ist der Artikel noch verfügbar?");

    if (priceAnalysis?.suggestedOfferPrice !== undefined) {
      lines.push(
        `Falls Sie beim Preis noch etwas Spielraum haben, wären für mich ${formatMoney(
          priceAnalysis.suggestedOfferPrice
        )} interessant.`
      );
    }

    if (includePickup) {
      lines.push("Ich könnte den Artikel bei passender Zeit auch kurzfristig abholen.");
    }

    if (includePaypal && includePickup) {
      lines.push(
        "Zahlung per PayPal Käuferschutz oder bar bei Abholung wäre für mich beides möglich."
      );
    } else if (includePaypal) {
      lines.push("Zahlung per PayPal Käuferschutz wäre für mich möglich.");
    } else if (includePickup) {
      lines.push("Barzahlung bei Abholung ist für mich problemlos möglich.");
    }

    if (tone === "direct") {
      lines.push("Danke und viele Grüße");
    } else {
      lines.push("Viele Grüße");
    }

    if (options.buyerName) {
      lines.push(options.buyerName);
    }

    return {
      text: lines.join("\n\n"),
      tone,
      containsPickup: includePickup,
      containsPaypal: includePaypal,
      personalizedWithSeller: Boolean(sellerName),
    };
  }
}
