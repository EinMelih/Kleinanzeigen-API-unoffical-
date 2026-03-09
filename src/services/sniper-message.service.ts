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
        `ich habe gerade Ihre Anzeige fuer "${title}" gesehen und habe direkt Interesse.`
      );
    } else if (tone === "careful") {
      lines.push(
        `ich habe Ihre Anzeige fuer "${title}" gesehen und wuerde den Artikel gerne naeher anschauen.`
      );
    } else {
      lines.push(
        `ich habe gerade Ihre Anzeige fuer "${title}" gesehen und habe Interesse an dem Artikel.`
      );
    }

    lines.push("Ist der Artikel noch verfuegbar?");

    if (priceAnalysis?.suggestedOfferPrice !== undefined) {
      lines.push(
        `Falls Sie beim Preis noch etwas Spielraum haben, waeren fuer mich ${formatMoney(
          priceAnalysis.suggestedOfferPrice
        )} interessant.`
      );
    }

    if (includePickup) {
      lines.push("Ich koennte den Artikel bei passender Zeit auch kurzfristig abholen.");
    }

    if (includePaypal && includePickup) {
      lines.push(
        "Zahlung per PayPal Kaeuferschutz oder bar bei Abholung waere fuer mich beides moeglich."
      );
    } else if (includePaypal) {
      lines.push("Zahlung per PayPal Kaeuferschutz waere fuer mich moeglich.");
    } else if (includePickup) {
      lines.push("Barzahlung bei Abholung ist fuer mich problemlos moeglich.");
    }

    if (tone === "direct") {
      lines.push("Danke und viele Gruesse");
    } else {
      lines.push("Viele Gruesse");
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
