/**
 * Search Types - Kleinanzeigen API
 *
 * Diese Datei enthält alle TypeScript-Typen für den Search-Endpoint.
 * Alle Werte sind live von kleinanzeigen.de verifiziert (Stand: 12.12.2024)
 *
 * URL-STRUKTUR WICHTIG:
 * Kleinanzeigen nutzt KEINE Query-Parameter (?key=value)
 * Alle Filter sind PFAD-BASIERT: /anbieter:privat/zustand:gebraucht/...
 */

// ============================================
// KATEGORIE IDs - Live von kleinanzeigen.de
// ============================================

/**
 * Haupt-Kategorien
 * Format in URL: c[ID], z.B. c161 für Elektronik
 * Beispiel: https://www.kleinanzeigen.de/s-elektronik/c161
 */
export enum MainCategory {
  /** c210 - Auto, Rad & Boot */
  AUTO_RAD_BOOT = "210",

  /** c161 - Elektronik */
  ELEKTRONIK = "161",

  /** c80 - Haus & Garten */
  HAUS_GARTEN = "80",

  /** c17 - Familie, Kind & Baby */
  FAMILIE_KIND_BABY = "17",

  /** c153 - Mode & Beauty */
  MODE_BEAUTY = "153",

  /** c185 - Freizeit, Hobby & Nachbarschaft */
  FREIZEIT_HOBBY = "185",

  /** c73 - Musik, Film & Bücher */
  MUSIK_FILM_BUECHER = "73",

  /** c130 - Haustiere */
  HAUSTIERE = "130",

  /** c195 - Immobilien */
  IMMOBILIEN = "195",

  /** c102 - Jobs */
  JOBS = "102",

  /** c297 - Dienstleistungen */
  DIENSTLEISTUNGEN = "297",

  /** c272 - Zu verschenken & Tauschen */
  VERSCHENKEN_TAUSCHEN = "272",

  /** c231 - Eintrittskarten & Tickets */
  TICKETS = "231",

  /** c230 - Unterricht & Kurse */
  UNTERRICHT = "230",
}

/**
 * Elektronik Unterkategorien (Haupt: c161)
 * URL-Beispiel: https://www.kleinanzeigen.de/s-handy-telefon/c173
 */
export enum ElektronikCategory {
  /** c172 - Audio & Hifi */
  AUDIO_HIFI = "172",

  /** c226 - Dienstleistungen Elektronik */
  DIENSTLEISTUNGEN = "226",

  /** c245 - Foto */
  FOTO = "245",

  /** c173 - Handy & Telefon */
  HANDY_TELEFON = "173",

  /** c176 - Haushaltsgeräte */
  HAUSHALTSGERAETE = "176",

  /** c279 - Konsolen */
  KONSOLEN = "279",

  /** c278 - Notebooks */
  NOTEBOOKS = "278",

  /** c228 - PCs */
  PCS = "228",

  /** c225 - PC-Zubehör & Software */
  PC_ZUBEHOER = "225",

  /** c285 - Tablets & Reader */
  TABLETS = "285",

  /** c175 - TV & Video */
  TV_VIDEO = "175",

  /** c227 - Videospiele */
  VIDEOSPIELE = "227",

  /** c168 - Weitere Elektronik */
  WEITERE = "168",
}

/**
 * Auto, Rad & Boot Unterkategorien (Haupt: c210)
 * URL-Beispiel: https://www.kleinanzeigen.de/s-autos/c216
 */
export enum AutoCategory {
  /** c216 - Autos */
  AUTOS = "216",

  /** c223 - Autoteile & Reifen */
  AUTOTEILE = "223",

  /** c211 - Boote & Bootszubehör */
  BOOTE = "211",

  /** c217 - Fahrräder & Zubehör */
  FAHRRAEDER = "217",

  /** c305 - Motorräder & Motorroller */
  MOTORRAEDER = "305",

  /** c306 - Motorradteile & Zubehör */
  MOTORRADTEILE = "306",

  /** c276 - Nutzfahrzeuge & Anhänger */
  NUTZFAHRZEUGE = "276",

  /** c280 - Reparaturen & Dienstleistungen */
  REPARATUREN = "280",

  /** c220 - Wohnwagen & -mobile */
  WOHNWAGEN = "220",

  /** c241 - Weiteres Auto, Rad & Boot */
  WEITERE = "241",
}

// ============================================
// FILTER URL-WERTE
// ============================================

/**
 * Anbieter-Typ
 * URL-Format: /anbieter:[wert]/
 * Beispiel: /anbieter:privat/
 */
export enum SellerType {
  /** Alle Anbieter (Standard) */
  ALL = "all",

  /** /anbieter:privat/ - Privatverkäufer */
  PRIVATE = "privat",

  /** /anbieter:gewerblich/ - Gewerblicher Verkäufer */
  COMMERCIAL = "gewerblich",
}

/**
 * Artikel-Zustand
 * URL-Format: /zustand:[wert]/
 * Beispiel: /zustand:gebraucht/
 */
export enum ArticleCondition {
  /** Alle Zustände (Standard) */
  ALL = "all",

  /** /zustand:neu/ - Neu */
  NEW = "neu",

  /** /zustand:gebraucht/ - Gebraucht */
  USED = "gebraucht",
}

/**
 * Angebots-Typ
 * URL-Format: /anzeige:[wert]/
 * Beispiel: /anzeige:angebote/
 */
export enum OfferType {
  /** Alle (Standard) */
  ALL = "all",

  /** /anzeige:angebote/ - Nur Angebote */
  OFFER = "angebote",

  /** /anzeige:gesuche/ - Nur Gesuche */
  WANTED = "gesuche",
}

/**
 * Versand-Option
 * URL-Format: /versand:[wert]/
 * Beispiel: /versand:ja/
 */
export enum ShippingOption {
  /** Alle (Standard) */
  ALL = "all",

  /** /versand:ja/ - Versand möglich */
  SHIPPING = "ja",

  /** /versand:nein/ - Nur Abholung */
  PICKUP_ONLY = "nein",
}

/**
 * Preis-Typ
 * URL-Format: /[typ]-preis/ oder in Kombination
 * Beispiel: /vb-preis/
 */
export enum PriceType {
  /** Alle (Standard) */
  ALL = "all",

  /** /vb-preis/ - Verhandlungsbasis */
  NEGOTIABLE = "vb",

  /** Festpreis */
  FIXED = "fest",

  /** /zu-verschenken/ */
  FREE = "verschenken",
}

/**
 * Sortierung
 * URL: Als Query-Parameter oder in Path
 * Beispiel: ?sortBy=SORTING_DATE
 */
export enum SortOption {
  /** Standard - Relevanz */
  RELEVANCE = "RELEVANCE",

  /** Neueste zuerst */
  NEWEST = "SORTING_DATE",

  /** Preis aufsteigend (günstigste zuerst) */
  PRICE_ASC = "PRICE_AMOUNT",

  /** Preis absteigend (teuerste zuerst) */
  PRICE_DESC = "PRICE_AMOUNT_DESC",
}

/**
 * Gültige Radius-Werte in km
 * URL-Format: r[km] am Ende der URL
 * Beispiel: ...k0l123r50 (50km Umkreis)
 */
export const VALID_RADII = [0, 5, 10, 20, 30, 50, 100, 150, 200] as const;
export type Radius = (typeof VALID_RADII)[number];

// ============================================
// REQUEST TYPES
// ============================================

/**
 * Such-Optionen für den API-Request
 */
export interface SearchOptions {
  /** Suchbegriff (z.B. "iPhone 13") */
  query: string;

  /** Anzahl Ergebnisse (1-100, default: 10) */
  count?: number;

  /** Alle Ergebnisse scrapen (ignoriert count) */
  scrapeAll?: boolean;

  // === Kategorie ===
  /** Kategorie-ID (z.B. "161" für Elektronik) */
  categoryId?: string;

  // === Standort ===
  /** Ort-Name (z.B. "Berlin") */
  location?: string;

  /** Postleitzahl (5-stellig, z.B. "10115") */
  postalCode?: string;

  /** Umkreis in km (5, 10, 20, 30, 50, 100, 150, 200) */
  radius?: Radius;

  // === Preis ===
  /** Mindestpreis in € */
  minPrice?: number;

  /** Maximalpreis in € */
  maxPrice?: number;

  /** Preis-Typ (VB, Festpreis, etc.) */
  priceType?: PriceType;

  // === Filter ===
  /** Anbieter-Typ (privat/gewerblich) */
  sellerType?: SellerType;

  /** Artikel-Zustand (neu/gebraucht) */
  condition?: ArticleCondition;

  /** Angebots-Typ (Angebot/Gesuch) */
  offerType?: OfferType;

  /** Versand-Option */
  shipping?: ShippingOption;

  // === Sortierung ===
  /** Sortierung */
  sortBy?: SortOption;

  // === Detail-Optionen ===
  /** Artikel-Beschreibung mitscrapen (extra Request pro Artikel) */
  includeDetails?: boolean;

  /** Alle Bilder-URLs holen */
  includeImages?: boolean;

  /** Verkäufer-Details holen (extra Request) */
  includeSellerInfo?: boolean;

  /** Bilder lokal speichern */
  downloadImages?: boolean;

  // === Werbe-Handling ===
  /** Werbeanzeigen überspringen (default: true) */
  skipAds?: boolean;

  // === Pagination ===
  /** Seiten-Nummer (1-basiert) */
  page?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Verkäufer-Bewertung/Badge
 *
 * WICHTIG: Scrape basierend auf CSS-Klassen, nicht Text!
 * Das macht die API sprachunabhängig.
 *
 * CSS-Klassen zu suchen:
 * - .userbadge-positive → Freundlich/Friendly
 * - .userbadge-neutral → OK
 * - .userbadge-negative → Schlecht
 * - .icon-rating-* → Rating-Level
 */
export enum SellerRating {
  /** Keine Bewertung vorhanden */
  NONE = "none",

  /** Freundlich (grünes Badge) - CSS: .userbadge-positive */
  FRIENDLY = "friendly",

  /** OK/Neutral (gelbes Badge) - CSS: .userbadge-neutral */
  OK = "ok",

  /** Zufriedenstellend */
  SATISFACTORY = "satisfactory",

  /** Schlecht (rotes Badge) - CSS: .userbadge-negative */
  BAD = "bad",
}

/**
 * Verkäufer-Badges/Auszeichnungen
 *
 * CSS-Klassen zu suchen:
 * - .badge-topseller → Top-Verkäufer
 * - .badge-verified → Verifiziert
 * - .badge-pro → Pro/Gewerblich
 */
export enum SellerBadge {
  /** Top-Verkäufer - CSS: .badge-topseller, [data-testid="top-seller"] */
  TOP_SELLER = "top_seller",

  /** Verifizierter Nutzer - CSS: .badge-verified */
  VERIFIED = "verified",

  /** Pro/Business Account - CSS: .badge-pro */
  PRO = "pro",

  /** Schnelle Antwort - CSS: .badge-fast-reply */
  FAST_REPLY = "fast_reply",
}

/**
 * Verkäufer-Informationen
 * Wird gescraped wenn includeSellerInfo=true
 *
 * SPRACH-UNABHÄNGIGES SCRAPING:
 * Nutze CSS-Klassen und data-Attribute statt Text-Matching!
 *
 * Beispiel CSS-Selektoren:
 * - Verkäufer-Box: [data-testid="seller-info"], .userprofile-vip
 * - Name: .userprofile-vip a, [data-testid="seller-name"]
 * - Typ: [data-testid="seller-type"], .userbadge-label
 * - Aktiv seit: .userprofile-vip-since, [data-testid="member-since"]
 * - Anzeigen-Anzahl: .userprofile-vip-ads, [data-testid="ad-count"]
 */
export interface SellerInfo {
  /** Verkäufer-ID (aus URL oder data-Attribut) */
  id: string;

  /** Anzeige-Name des Verkäufers */
  name: string;

  /** Typ: privat oder gewerblich - CSS: [data-testid="seller-type"] */
  type: "private" | "commercial";

  /**
   * Top-Verkäufer Badge
   * CSS: .badge-topseller, [data-testid="top-seller-badge"]
   */
  isTopSeller: boolean;

  /**
   * Verifizierter Account
   * CSS: .badge-verified, [data-testid="verified-badge"]
   */
  isVerified?: boolean;

  /** Alle Badges die der Verkäufer hat */
  badges: SellerBadge[];

  /**
   * Freundlichkeits-Bewertung
   * CSS: .userbadge-positive|neutral|negative
   */
  rating?: SellerRating | undefined;

  /** Anzahl Bewertungen */
  ratingCount?: number;

  /** Positive Bewertungen in Prozent (z.B. 98) */
  positiveRatingPercent?: number;

  /** Aktiv seit - CSS: .userprofile-vip-since */
  memberSince?: string | undefined;

  /** Anzahl aktiver Anzeigen - CSS: .userprofile-vip-ads */
  activeListings?: number | undefined;

  /** Profil-URL */
  profileUrl: string;

  /** Antwortrate in Prozent (z.B. "95%") */
  responseRate?: string;

  /** Durchschnittliche Antwortzeit (z.B. "< 1 Stunde") */
  responseTime?: string;

  /**
   * Follower-Anzahl (falls Pro/Shop)
   * CSS: [data-testid="follower-count"]
   */
  followerCount?: number;
}

/**
 * Einzelner Artikel aus der Suche
 */
export interface SearchArticle {
  // === Basis-Infos ===
  /** Kleinanzeigen Artikel-ID */
  id: string;

  /** Titel der Anzeige */
  title: string;

  /** Direkt-Link zur Anzeige */
  url: string;

  // === Preis ===
  /** Preis in € (null wenn "Zu verschenken" oder "Auf Anfrage") */
  price: number | null;

  /** Original Preis-String (z.B. "150 € VB") */
  priceRaw: string;

  /** Preis-Typ */
  priceType: "fixed" | "negotiable" | "free" | "on_request";

  // === Standort ===
  /** Stadt/Ort */
  location: string;

  /** PLZ (falls im HTML verfügbar) */
  postalCode?: string | undefined;

  // === Zeit ===
  /** Erstellungsdatum (ISO String) */
  createdAt: string;

  /** Relative Zeit (z.B. "Heute, 14:30" oder "Gestern") */
  createdAtRelative: string;

  // === Bilder ===
  /** Vorschaubild URL */
  thumbnailUrl: string;

  /** Alle Bild-URLs (wenn includeImages=true) */
  images: string[];

  /** Anzahl Bilder */
  imageCount: number;

  /**
   * Lokale Pfade zu heruntergeladenen Bildern (wenn downloadImages=true)
   * Format: Array von { url, localPath }
   */
  downloadedImages?: Array<{
    /** Original URL */
    url: string;
    /** Lokaler Pfad relativ zum Projekt-Root */
    localPath: string;
  }>;

  // === Details (wenn includeDetails=true) ===
  /** Vollständige Beschreibung */
  description?: string;

  // === Versand ===
  /** Versand möglich? */
  hasShipping: boolean;

  // === Verkäufer (wenn includeSellerInfo=true) ===
  /** Verkäufer-Informationen */
  seller?: SellerInfo;

  // === Meta ===
  /** Ist das eine Werbe-Anzeige? */
  isAd: boolean;

  /** Anzahl Aufrufe (falls sichtbar) */
  viewCount?: number;

  /** Kategorie-ID */
  categoryId?: string;

  /** Kategorie-Name */
  categoryName?: string;
}

/**
 * Such-Ergebnis Response
 */
export interface SearchResult {
  /** Erfolgreich? */
  success: boolean;

  // === Meta ===
  /** Such-Query */
  query: string;

  /** Angewendete Filter */
  appliedFilters: Partial<SearchOptions>;

  // === Statistik ===
  /** Gesamt verfügbare Ergebnisse */
  totalAvailable: number;

  /** Anzahl Seiten gesamt */
  totalPages: number;

  /** Tatsächlich gescrapte Seiten */
  pagesScraped: number;

  /** Anzahl gescrapte Artikel */
  articlesScraped: number;

  /** Übersprungene Werbeanzeigen */
  adsSkipped: number;

  // === Ergebnisse ===
  /** Gefundene Artikel */
  articles: SearchArticle[];

  // === URLs ===
  /** Konstruierte Such-URL */
  searchUrl: string;

  // === Timing ===
  /** Zeitpunkt des Scrapings (ISO String) */
  scrapedAt: string;

  /** Dauer in Millisekunden */
  scrapeDurationMs: number;

  // === Fehler ===
  /** Fehlermeldung wenn success=false */
  error?: string;

  /** Warnungen (z.B. "Einige Seiten konnten nicht geladen werden") */
  warnings?: string[];
}

// ============================================
// URL BUILDER HELPER
// ============================================

/**
 * Baut die Kleinanzeigen Such-URL zusammen
 *
 * URL-Struktur:
 * https://www.kleinanzeigen.de/s-[filter1]/[filter2]/[suchbegriff]/k[kat]l[ort]r[radius]
 *
 * @example
 * buildSearchUrl({
 *   query: "iPhone 13",
 *   sellerType: SellerType.PRIVATE,
 *   condition: ArticleCondition.USED,
 *   radius: 50
 * })
 * // => "https://www.kleinanzeigen.de/s-anbieter:privat/zustand:gebraucht/iphone-13/k0l0r50"
 */
export function buildSearchUrl(options: SearchOptions): string {
  const BASE_URL = "https://www.kleinanzeigen.de";
  const parts: string[] = [];

  // Filter hinzufügen (Reihenfolge ist wichtig!)
  if (options.shipping && options.shipping !== ShippingOption.ALL) {
    parts.push(`versand:${options.shipping}`);
  }

  if (options.condition && options.condition !== ArticleCondition.ALL) {
    parts.push(`zustand:${options.condition}`);
  }

  if (options.sellerType && options.sellerType !== SellerType.ALL) {
    parts.push(`anbieter:${options.sellerType}`);
  }

  if (options.offerType && options.offerType !== OfferType.ALL) {
    parts.push(`anzeige:${options.offerType}`);
  }

  // Preis-Range
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const min = options.minPrice ?? "";
    const max = options.maxPrice ?? "";
    parts.push(`preis:${min}:${max}`);
  }

  // Preis-Typ
  if (options.priceType && options.priceType !== PriceType.ALL) {
    if (options.priceType === PriceType.NEGOTIABLE) {
      parts.push("vb-preis");
    } else if (options.priceType === PriceType.FREE) {
      parts.push("zu-verschenken");
    }
  }

  // Suchbegriff (URL-encoded, Leerzeichen werden zu -)
  const query = options.query
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(
      /[äöüß]/g,
      (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c)
    );
  parts.push(query);

  // Suffix: k[kategorie]l[ort]r[radius]
  const categoryPart = options.categoryId ? `c${options.categoryId}` : "k0";
  const locationPart = "l0"; // TODO: Ort-ID Mapping implementieren
  const radiusPart = options.radius ? `r${options.radius}` : "";

  const suffix = `${categoryPart}${locationPart}${radiusPart}`;

  // Seite (pagination)
  if (options.page && options.page > 1) {
    parts.push(`seite:${options.page}`);
  }

  // URL zusammenbauen
  const path = parts.join("/");
  return `${BASE_URL}/s-${path}/${suffix}`;
}
