/**
 * Search Parser Service
 *
 * Extrahiert Artikel-Daten aus Kleinanzeigen HTML.
 * SPRACH-UNABHÄNGIG: Nutzt CSS-Klassen statt Text-Matching!
 *
 * @see todos/SEARCH.md für CSS-Selektoren Referenz
 */
import { Page, ElementHandle } from "puppeteer";
import {
  SearchArticle,
  SellerInfo,
  SellerBadge,
  SellerRating,
} from "../types/search.types";

// ============================================
// CSS SELEKTOREN - Sprach-unabhängig!
// ============================================

const SELECTORS = {
  // Artikel-Liste
  ARTICLE_LIST: ".aditem",
  ARTICLE_ITEM: "[data-adid], .aditem",

  // Artikel-Basis
  ARTICLE_ID: "[data-adid]",
  ARTICLE_LINK: ".aditem-main a[href*='/s-anzeige/']",
  ARTICLE_TITLE: ".text-module-begin a, .aditem-title",

  // Preis
  PRICE:
    "[data-testid='price'], .aditem-main--middle--price-shipping--price, .aditem-main--middle--price",
  PRICE_NEGOTIABLE:
    ".aditem-main--middle--price-shipping--price--negotiable, [class*='negotiable']",

  // Standort & Zeit
  LOCATION: ".aditem-main--top--left, [data-testid='location']",
  DATE: ".aditem-main--top--right, [data-testid='date']",

  // Bilder
  THUMBNAIL: ".aditem-image img, .imagebox img",
  IMAGE_COUNT: ".aditem-image--counter, .imagebox-counter",

  // Versand
  SHIPPING_BADGE:
    ".icon-shipping, [data-testid='shipping-badge'], .aditem-main--middle--price-shipping--shipping",

  // Werbung erkennen
  SPONSORED_AD:
    ".ad-listitem--has-sponsored-badge, [data-ad-type='sponsored'], .aditem--is-topad",

  // Verkäufer (auf Detail-Seite)
  SELLER_BOX: "[data-testid='seller-info'], .userprofile-vip, #viewad-contact",
  SELLER_NAME:
    ".userprofile-vip a, [data-testid='seller-name'], #viewad-contact .text-body-regular-strong",
  SELLER_LINK:
    ".userprofile-vip a[href*='/s-bestandsliste'], #viewad-contact a[href*='/s-bestandsliste']",
  SELLER_TYPE_PRIVATE:
    "[data-user-type='private'], .userbadge-private, .icon-user-private",
  SELLER_TYPE_COMMERCIAL:
    "[data-user-type='commercial'], .userbadge-commercial, .icon-user-commercial",
  SELLER_TOP_BADGE:
    ".badge-topseller, [data-testid='top-seller'], .userbadge-top",
  SELLER_VERIFIED: ".badge-verified, [data-testid='verified-badge']",
  SELLER_RATING_POSITIVE: ".userbadge-positive, .rating-positive",
  SELLER_RATING_NEUTRAL: ".userbadge-neutral, .rating-neutral",
  SELLER_RATING_NEGATIVE: ".userbadge-negative, .rating-negative",
  SELLER_MEMBER_SINCE: ".userprofile-vip-since, [data-testid='member-since']",
  SELLER_AD_COUNT: ".userprofile-vip-ads, [data-testid='ad-count']",

  // Erweiterte Seller-Infos (auf Detail-Seite im Kontakt-Bereich)
  SELLER_RESPONSE_TIME:
    "[data-testid='response-time'], .userbadge-response, #viewad-contact .text-body-regular",
  SELLER_FOLLOWER_COUNT:
    "[data-testid='follower-count'], .userprofile-follower",
  SELLER_ACTIVE_SINCE:
    "[data-testid='active-since'], #viewad-contact .text-body-regular",
  SELLER_RATING_BADGE:
    "#viewad-contact .userbadge, [data-testid='seller-rating'], .iconcard-userbadge",
  SELLER_RATING_TEXT:
    "#viewad-contact .userbadge-text, .iconcard-userbadge-text",
  SELLER_ALL_ADS_LINK:
    "#viewad-contact a[href*='s-bestandsliste'], a.text-body-regular-strong[href*='s-bestandsliste']",

  // Artikel-Detail (auf Detail-Seite)
  DETAIL_DESCRIPTION: "#viewad-description-text, [data-testid='description']",
  DETAIL_IMAGES:
    "#viewad-image img, .galleryimage img, [data-testid='gallery'] img",
  DETAIL_ATTRIBUTES: "#viewad-attributes, [data-testid='attributes']",
} as const;

// ============================================
// PARSER KLASSE
// ============================================

export class SearchParser {
  /**
   * Extrahiert alle Artikel von einer Such-Ergebnisseite
   */
  async parseSearchResults(page: Page): Promise<SearchArticle[]> {
    const articles: SearchArticle[] = [];

    // Finde alle Artikel-Elemente
    const articleElements = await page.$$(SELECTORS.ARTICLE_ITEM);

    for (let i = 0; i < articleElements.length; i++) {
      try {
        const articleElement = articleElements[i];
        if (!articleElement) continue;
        const article = await this.parseArticleElement(articleElement);
        if (article) {
          articles.push(article);
        }
      } catch (error) {
        console.warn(`Fehler beim Parsen von Artikel ${i}:`, error);
      }
    }

    return articles;
  }

  /**
   * Parsed ein einzelnes Artikel-Element aus der Liste
   */
  async parseArticleElement(
    element: ElementHandle
  ): Promise<SearchArticle | null> {
    try {
      // Prüfe ob Werbung
      const isAd = await this.isSponsored(element);

      // ID extrahieren
      const id =
        (await this.extractAttribute(element, "data-adid")) ||
        (await this.extractIdFromLink(element));

      if (!id) {
        return null; // Kein gültiger Artikel
      }

      // Basis-Daten
      const title = await this.extractText(element, SELECTORS.ARTICLE_TITLE);
      const url = await this.extractHref(element, SELECTORS.ARTICLE_LINK);

      // Preis
      const priceData = await this.parsePrice(element);

      // Standort & Zeit
      const location = await this.extractText(element, SELECTORS.LOCATION);
      const createdAtRelative = await this.extractText(element, SELECTORS.DATE);

      // Bilder
      const thumbnailUrl = await this.extractSrc(element, SELECTORS.THUMBNAIL);
      const imageCountText = await this.extractText(
        element,
        SELECTORS.IMAGE_COUNT
      );
      const imageCount = this.parseImageCount(imageCountText);

      // Versand
      const hasShipping = await this.hasElement(
        element,
        SELECTORS.SHIPPING_BADGE
      );

      return {
        id,
        title: title || "",
        url: url ? `https://www.kleinanzeigen.de${url}` : "",
        price: priceData.price,
        priceRaw: priceData.priceRaw,
        priceType: priceData.priceType,
        location: location || "",
        postalCode: this.extractPostalCode(location),
        createdAt: new Date().toISOString(), // Wird später präzisiert
        createdAtRelative: createdAtRelative || "",
        thumbnailUrl: thumbnailUrl || "",
        images: [],
        imageCount,
        hasShipping,
        isAd,
      };
    } catch (error) {
      console.error("Fehler beim Parsen des Artikel-Elements:", error);
      return null;
    }
  }

  /**
   * Prüft ob das Element eine Werbeanzeige ist
   */
  private async isSponsored(element: ElementHandle): Promise<boolean> {
    return await this.hasElement(element, SELECTORS.SPONSORED_AD);
  }

  /**
   * Parsed Preis-Informationen
   */
  private async parsePrice(element: ElementHandle): Promise<{
    price: number | null;
    priceRaw: string;
    priceType: "fixed" | "negotiable" | "free" | "on_request";
  }> {
    const priceText = (await this.extractText(element, SELECTORS.PRICE)) || "";
    const isNegotiable = await this.hasElement(
      element,
      SELECTORS.PRICE_NEGOTIABLE
    );

    // Preis extrahieren
    const priceMatch = priceText.match(/[\d.,]+/);
    const price = priceMatch
      ? parseFloat(priceMatch[0].replace(".", "").replace(",", "."))
      : null;

    // Preis-Typ bestimmen (sprach-unabhängig)
    let priceType: "fixed" | "negotiable" | "free" | "on_request" = "fixed";

    if (price === 0 || (priceText.includes("0") && priceText.length < 5)) {
      priceType = "free";
    } else if (
      isNegotiable ||
      priceText.includes("VB") ||
      priceText.includes("€ VB")
    ) {
      priceType = "negotiable";
    } else if (price === null) {
      priceType = "on_request";
    }

    return { price, priceRaw: priceText, priceType };
  }

  /**
   * Extrahiert PLZ aus Location-String
   */
  private extractPostalCode(location: string | null): string | undefined {
    if (!location) return undefined;
    const match = location.match(/\b\d{5}\b/);
    return match ? match[0] : undefined;
  }

  /**
   * Parsed Bild-Anzahl aus Text wie "1/5"
   */
  private parseImageCount(text: string | null): number {
    if (!text) return 0;
    const match = text.match(/(\d+)/);
    return match && match[1] ? parseInt(match[1]) : 0;
  }

  // ============================================
  // VERKÄUFER PARSING (für Detail-Seiten)
  // ============================================

  /**
   * Parsed Verkäufer-Informationen von einer Detail-Seite
   * Extrahiert alle verfügbaren Seller-Daten aus dem Kontakt-Bereich
   */
  async parseSellerInfo(page: Page): Promise<SellerInfo | null> {
    try {
      const sellerBox = await page.$(SELECTORS.SELLER_BOX);
      if (!sellerBox) return null;

      // Name & Link
      const name = await this.extractTextFromPage(page, SELECTORS.SELLER_NAME);
      const profileUrl = await this.extractHrefFromPage(
        page,
        SELECTORS.SELLER_LINK
      );
      const id = profileUrl ? this.extractSellerIdFromUrl(profileUrl) : "";

      // Typ (CSS-basiert!)
      const isCommercial =
        (await page.$(SELECTORS.SELLER_TYPE_COMMERCIAL)) !== null;
      const type = isCommercial ? "commercial" : "private";

      // Badges sammeln
      const badges = await this.collectSellerBadges(page);
      const isTopSeller = badges.includes(SellerBadge.TOP_SELLER);
      const isVerified = badges.includes(SellerBadge.VERIFIED);

      // Rating aus Text und CSS
      const rating = await this.parseSellerRating(page);
      const ratingText = await this.extractRatingText(page);

      // Zusatz-Infos
      const memberSince = await this.extractMemberSince(page);
      const adCountText = await this.extractTextFromPage(
        page,
        SELECTORS.SELLER_AD_COUNT
      );
      const activeListings = adCountText
        ? parseInt(adCountText.match(/\d+/)?.[0] || "0")
        : await this.extractActiveListingsFromAllAdsLink(page);

      // Antwortzeit - z.B. "Antwortet in der Regel innerhalb von 1 Stunde"
      const responseTime = await this.extractResponseTime(page);

      // Follower
      const followerCount = await this.extractFollowerCount(page);

      return {
        id,
        name: name || "",
        type,
        isTopSeller,
        isVerified,
        badges,
        rating,
        ratingText,
        memberSince,
        activeListings,
        responseTime,
        followerCount,
        profileUrl: profileUrl
          ? `https://www.kleinanzeigen.de${profileUrl}`
          : "",
      };
    } catch (error) {
      console.error("Fehler beim Parsen der Verkäufer-Info:", error);
      return null;
    }
  }

  /**
   * Sammelt alle Badges eines Verkäufers
   */
  private async collectSellerBadges(page: Page): Promise<SellerBadge[]> {
    const badges: SellerBadge[] = [];

    if (await page.$(SELECTORS.SELLER_TOP_BADGE)) {
      badges.push(SellerBadge.TOP_SELLER);
    }
    if (await page.$(SELECTORS.SELLER_VERIFIED)) {
      badges.push(SellerBadge.VERIFIED);
    }
    // PRO und FAST_REPLY könnten weitere Selektoren brauchen

    return badges;
  }

  /**
   * Parsed Verkäufer-Rating (CSS-basiert!)
   */
  private async parseSellerRating(
    page: Page
  ): Promise<SellerRating | undefined> {
    if (await page.$(SELECTORS.SELLER_RATING_POSITIVE)) {
      return SellerRating.FRIENDLY;
    }
    if (await page.$(SELECTORS.SELLER_RATING_NEUTRAL)) {
      return SellerRating.OK;
    }
    if (await page.$(SELECTORS.SELLER_RATING_NEGATIVE)) {
      return SellerRating.BAD;
    }
    return undefined;
  }

  /**
   * Extrahiert Rating-Text (z.B. "Freundlich", "OK Zufriedenheit", "TOP")
   * Sucht im Kontakt-Bereich nach Badge-Texten
   */
  private async extractRatingText(page: Page): Promise<string | undefined> {
    try {
      // Versuche verschiedene Selektoren für den Rating-Text
      const ratingText = await page.evaluate(() => {
        // Suche im viewad-contact Bereich nach Rating-Elementen
        const contactSection = document.querySelector("#viewad-contact");
        if (!contactSection) return null;

        // Suche nach "Freundlich", "OK", "TOP" Text-Elementen
        const possibleTexts = [
          "Freundlich",
          "OK Zufriedenheit",
          "TOP Zufriedenheit",
          "Zufriedenheit",
        ];

        // Durchsuche alle Text-Elemente im Kontakt-Bereich
        const allText = contactSection.textContent || "";
        for (const text of possibleTexts) {
          if (allText.includes(text)) {
            return text;
          }
        }

        // Fallback: Badge-Text direkt lesen
        const badgeEl = contactSection.querySelector(
          ".userbadge-text, .iconcard-userbadge-text"
        );
        return badgeEl?.textContent?.trim() || null;
      });

      return ratingText || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extrahiert "Aktiv seit" Datum
   * Sucht nach "Aktiv seit DD.MM.YYYY" oder ähnlichen Mustern
   */
  private async extractMemberSince(page: Page): Promise<string | undefined> {
    try {
      const memberSince = await page.evaluate(() => {
        const contactSection = document.querySelector("#viewad-contact");
        if (!contactSection) return null;

        const allText = contactSection.textContent || "";

        // Suche nach "Aktiv seit" Pattern
        const match = allText.match(/Aktiv seit\s+(\d{2}\.\d{2}\.\d{4})/i);
        if (match && match[1]) {
          return match[1];
        }

        // Alternative: Suche nach Datum-Pattern
        const dateMatch = allText.match(
          /seit\s+(\d{2}\.\d{2}\.\d{4}|\d{4})/i
        );
        if (dateMatch && dateMatch[1]) {
          return dateMatch[1];
        }

        return null;
      });

      return memberSince || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extrahiert Antwortzeit
   * z.B. "Antwortet in der Regel innerhalb von 1 Stunde"
   */
  private async extractResponseTime(page: Page): Promise<string | undefined> {
    try {
      const responseTime = await page.evaluate(() => {
        const contactSection = document.querySelector("#viewad-contact");
        if (!contactSection) return null;

        const allText = contactSection.textContent || "";

        // Suche nach "Antwortet" Pattern
        const match = allText.match(
          /Antwortet\s+(in der Regel\s+)?innerhalb\s+von\s+([^\.]+)/i
        );
        if (match) {
          return match[0].trim();
        }

        // Alternative Patterns
        const altMatch = allText.match(/Antwortzeit[:\s]+([^\.]+)/i);
        if (altMatch && altMatch[1]) {
          return altMatch[1].trim();
        }

        return null;
      });

      return responseTime || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extrahiert Follower-Anzahl
   */
  private async extractFollowerCount(page: Page): Promise<number | undefined> {
    try {
      const followerCount = await page.evaluate(() => {
        const contactSection = document.querySelector("#viewad-contact");
        if (!contactSection) return null;

        const allText = contactSection.textContent || "";

        // Suche nach "X Follower" Pattern
        const match = allText.match(/(\d+)\s*Follower/i);
        if (match && match[1]) {
          return parseInt(match[1]);
        }

        return null;
      });

      return followerCount || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extrahiert Anzahl aktiver Anzeigen aus dem "Alle Anzeigen" Link
   * Falls kein direkter Counter vorhanden ist
   */
  private async extractActiveListingsFromAllAdsLink(
    page: Page
  ): Promise<number | undefined> {
    try {
      const count = await page.evaluate(() => {
        const contactSection = document.querySelector("#viewad-contact");
        if (!contactSection) return null;

        // Suche nach "X Anzeigen online" oder ähnlichen Mustern
        const allText = contactSection.textContent || "";
        const match = allText.match(/(\d+)\s*Anzeigen?\s*(online)?/i);
        if (match && match[1]) {
          return parseInt(match[1]);
        }

        return null;
      });

      return count || undefined;
    } catch {
      return undefined;
    }
  }


  /**
   * Extrahiert Verkäufer-ID aus Profil-URL
   */
  private extractSellerIdFromUrl(url: string): string {
    const match = url.match(/s-bestandsliste\.html\?userId=(\d+)/);
    return match && match[1] ? match[1] : "";
  }

  // ============================================
  // HELPER METHODEN
  // ============================================

  private async extractText(
    element: ElementHandle,
    selector: string
  ): Promise<string | null> {
    try {
      const el = await element.$(selector);
      if (!el) return null;
      return await el.evaluate((e) => e.textContent?.trim() || null);
    } catch {
      return null;
    }
  }

  private async extractTextFromPage(
    page: Page,
    selector: string
  ): Promise<string | null> {
    try {
      const el = await page.$(selector);
      if (!el) return null;
      return await el.evaluate((e) => e.textContent?.trim() || null);
    } catch {
      return null;
    }
  }

  private async extractHref(
    element: ElementHandle,
    selector: string
  ): Promise<string | null> {
    try {
      const el = await element.$(selector);
      if (!el) return null;
      return await el.evaluate((e) => e.getAttribute("href"));
    } catch {
      return null;
    }
  }

  private async extractHrefFromPage(
    page: Page,
    selector: string
  ): Promise<string | null> {
    try {
      const el = await page.$(selector);
      if (!el) return null;
      return await el.evaluate((e) => e.getAttribute("href"));
    } catch {
      return null;
    }
  }

  private async extractSrc(
    element: ElementHandle,
    selector: string
  ): Promise<string | null> {
    try {
      const el = await element.$(selector);
      if (!el) return null;
      return await el.evaluate(
        (e) => e.getAttribute("src") || e.getAttribute("data-src")
      );
    } catch {
      return null;
    }
  }

  private async extractAttribute(
    element: ElementHandle,
    attr: string
  ): Promise<string | null> {
    try {
      return await element.evaluate((e, a) => e.getAttribute(a), attr);
    } catch {
      return null;
    }
  }

  private async hasElement(
    element: ElementHandle,
    selector: string
  ): Promise<boolean> {
    try {
      return (await element.$(selector)) !== null;
    } catch {
      return false;
    }
  }

  private async extractIdFromLink(
    element: ElementHandle
  ): Promise<string | null> {
    const href = await this.extractHref(element, SELECTORS.ARTICLE_LINK);
    if (!href) return null;
    const match = href.match(/\/(\d+)$/);
    return match && match[1] ? match[1] : null;
  }
}
