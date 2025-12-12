# 🔍 Search Endpoint - Vollständige Spezifikation

> Status: **IN PLANUNG** → Verifiziert am 12.12.2024
> Letzte Aktualisierung: 12.12.2024

---

## 📌 Übersicht

Der Search-Endpoint ist das Herzstück der API. Er ermöglicht:

- Suche nach Artikeln mit umfangreichen Filtern
- Artikel-Detail-Scraping mit Verkäufer-Infos
- Werbung-Erkennung und -Filterung
- Count-Only Mode (nur Anzahl ohne Scraping)

---

## 🌐 URL-Struktur (Live verifiziert!)

**WICHTIG:** Kleinanzeigen nutzt **KEINE Query-Parameter** (`?key=value`),
sondern baut Filter direkt in den **URL-Pfad** ein!

### Basis-Schema

```
https://www.kleinanzeigen.de/s-[filter1]:[wert1]/[filter2]:[wert2]/.../[suchbegriff]/k[kategorie]l[ort]r[radius]
```

### Beispiele

```
# Einfache Suche
https://www.kleinanzeigen.de/s-iphone-13/k0

# Mit Ort + Umkreis
https://www.kleinanzeigen.de/s-iphone-13/k0l0r10
                                           ↑  ↑ ↑
                                           |  | └─ r10 = 10km Radius
                                           |  └─── l0 = Ort-ID (0 = kein spezifischer)
                                           └────── k0 = Kategorie (0 = alle)

# Volle Filter-Kette
https://www.kleinanzeigen.de/s-versand:ja/zustand:gebraucht/anbieter:privat/anzeige:angebote/iphone-13/vb-preis/k0l0r10
```

### URL-Parameter Mapping

| API Parameter              | URL-Format              | Werte                                                    |
| -------------------------- | ----------------------- | -------------------------------------------------------- |
| `sellerType: "private"`    | `/anbieter:privat/`     | `privat`, `gewerblich`                                   |
| `sellerType: "commercial"` | `/anbieter:gewerblich/` |                                                          |
| `condition: "used"`        | `/zustand:gebraucht/`   | `neu`, `gebraucht`                                       |
| `condition: "new"`         | `/zustand:neu/`         |                                                          |
| `offerType: "offer"`       | `/anzeige:angebote/`    | `angebote`, `gesuche`                                    |
| `offerType: "wanted"`      | `/anzeige:gesuche/`     |                                                          |
| `hasShipping: true`        | `/versand:ja/`          | `ja`, `nein`                                             |
| `priceType: "negotiable"`  | `/vb-preis/`            | `vb-preis`                                               |
| `sortBy: "newest"`         | Suffix oder Parameter   | `sorting_date`                                           |
| `radius: 10`               | `r10` am Ende           | `r5`, `r10`, `r20`, `r30`, `r50`, `r100`, `r150`, `r200` |

---

## 🎯 API Endpoints - JETZT TESTBAR!

Der Server läuft auf `http://localhost:87`

---

### `GET /search` - Quick Search

**Einfachste Methode zum Testen:**

```bash
# Basis-Suche
curl "http://localhost:87/search?q=iPhone"

# Mit Anzahl
curl "http://localhost:87/search?q=iPhone&count=5"

# Mit Ort
curl "http://localhost:87/search?q=iPhone&location=Berlin"
```

**Parameter:**
| Parameter | Typ | Required | Beschreibung |
|-----------|-----|----------|--------------|
| `q` | string | ✅ | Suchbegriff |
| `count` | string | ❌ | Anzahl (default: 10) |
| `location` | string | ❌ | Ort/Stadt |

---

### `POST /search` - Erweiterte Suche

**Volle Kontrolle über alle Filter:**

```bash
# Einfach
curl -X POST http://localhost:87/search \
  -H "Content-Type: application/json" \
  -d '{"query": "iPhone 13"}'

# Mit allen Filtern
curl -X POST http://localhost:87/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "iPhone 13",
    "count": 20,
    "location": "Berlin",
    "radius": 50,
    "minPrice": 200,
    "maxPrice": 800,
    "sortBy": "SORTING_DATE",
    "includeDetails": true
  }'
```

**Body-Parameter:**
| Parameter | Typ | Required | Default | Beschreibung |
|-----------|-----|----------|---------|--------------|
| `query` | string | ✅ | - | Suchbegriff |
| `count` | number | ❌ | 10 | Anzahl (1-100) |
| `scrapeAll` | boolean | ❌ | false | Alle Seiten scrapen |
| `location` | string | ❌ | - | Ort/Stadt |
| `radius` | number | ❌ | - | Umkreis in km |
| `minPrice` | number | ❌ | - | Mindestpreis € |
| `maxPrice` | number | ❌ | - | Maximalpreis € |
| `sortBy` | string | ❌ | RELEVANCE | SORTING_DATE, PRICE_AMOUNT, RELEVANCE |
| `includeDetails` | boolean | ❌ | false | Beschreibung mitscrapen |

---

### Beispiel-Response

```json
{
  "status": "success",
  "result": {
    "success": true,
    "query": "iPhone 13",
    "totalAvailable": 1250,
    "totalPages": 50,
    "pagesScraped": 1,
    "articlesScraped": 10,
    "articles": [
      {
        "id": "2847392847",
        "title": "iPhone 13 Pro 256GB",
        "url": "https://www.kleinanzeigen.de/s-anzeige/...",
        "price": 650,
        "priceRaw": "650 € VB",
        "priceType": "negotiable",
        "location": "Berlin",
        "createdAtRelative": "Heute, 21:30",
        "thumbnailUrl": "https://img.kleinanzeigen.de/...",
        "imageCount": 5,
        "hasShipping": true,
        "isAd": false
      }
    ],
    "searchUrl": "https://www.kleinanzeigen.de/s-iphone-13/k0",
    "scrapedAt": "2024-12-12T22:00:00Z"
  },
  "imagesDownloaded": true,
  "timestamp": "2024-12-12T22:00:00.123Z"
}
```

---

### `POST /scrape` - Scrape spezifische URLs 🆕

**Direkt Artikel-URLs eingeben und mit Bildern scrapen:**

```bash
# Eine URL scrapen
curl -X POST http://localhost:87/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.kleinanzeigen.de/s-anzeige/iphone-13/123456789-173"],
    "downloadImages": true
  }'

# Mehrere URLs scrapen
curl -X POST http://localhost:87/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.kleinanzeigen.de/s-anzeige/artikel-1/111111111-173",
      "https://www.kleinanzeigen.de/s-anzeige/artikel-2/222222222-173",
      "https://www.kleinanzeigen.de/s-anzeige/artikel-3/333333333-173"
    ],
    "downloadImages": true
  }'
```

**Parameter:**
| Parameter | Typ | Required | Default | Beschreibung |
|-----------|-----|----------|---------|--------------|
| `urls` | string[] | ✅ | - | Array von Artikel-URLs (max. 50) |
| `downloadImages` | boolean | ❌ | false | Bilder lokal speichern |

**Response:**

```json
{
  "status": "success",
  "totalUrls": 3,
  "successfulScrapes": 3,
  "failedScrapes": 0,
  "results": [
    {
      "url": "https://www.kleinanzeigen.de/s-anzeige/...",
      "success": true,
      "article": {
        "id": "123456789",
        "title": "iPhone 13 Pro 256GB",
        "price": "650 € VB",
        "description": "Vollständige Beschreibung...",
        "location": "Berlin",
        "images": ["https://img.kleinanzeigen.de/..."],
        "downloadedImages": [
          {
            "url": "https://img.kleinanzeigen.de/...",
            "localPath": "data/images/123456789/image_0.jpg"
          }
        ],
        "seller": {
          "name": "Max Mustermann",
          "profileUrl": "/s-bestandsliste.html?userId=12345"
        }
      }
    }
  ],
  "timestamp": "2024-12-12T23:00:00Z"
}
```

---

### Bild-Download Option 📷

Bei allen Endpoints kann `downloadImages: true` gesetzt werden:

```bash
# GET mit Download
curl "http://localhost:87/search?q=iPhone&count=3&download=true"

# POST mit Download
curl -X POST http://localhost:87/search \
  -H "Content-Type: application/json" \
  -d '{"query": "iPhone", "count": 3, "downloadImages": true}'
```

**Bilder werden gespeichert in:** `data/images/{artikel-id}/image_0.jpg`

---

## 📋 Request Parameter

### Basis-Parameter

| Parameter   | Typ       | Required | Default | Beschreibung                   |
| ----------- | --------- | -------- | ------- | ------------------------------ |
| `query`     | `string`  | ✅       | -       | Suchbegriff (z.B. "iPhone 13") |
| `count`     | `number`  | ❌       | `10`    | Anzahl Ergebnisse (1-100)      |
| `scrapeAll` | `boolean` | ❌       | `false` | Alle Ergebnisse scrapen        |

### Kategorie-Filter

| Parameter      | Typ      | Required | Default | Beschreibung                              |
| -------------- | -------- | -------- | ------- | ----------------------------------------- |
| `categoryId`   | `string` | ❌       | -       | Kleinanzeigen Kategorie-ID                |
| `categoryPath` | `string` | ❌       | -       | Kategorie-Pfad (z.B. "elektronik/handys") |

#### Verfügbare Kategorien (Auszug)

```typescript
enum KleinanzeigenCategory {
  // Hauptkategorien
  AUTO_RAD_BOOT = "210",
  ELEKTRONIK = "161",
  HAUS_GARTEN = "80",
  FAMILIE_KIND_BABY = "17",
  MODE_BEAUTY = "153",
  FREIZEIT_HOBBY = "185",
  MUSIK_FILM_BUECHER = "73",
  HAUSTIERE = "130",
  IMMOBILIEN = "87",
  JOBS = "102",
  DIENSTLEISTUNGEN = "259",

  // Sub-Kategorien Elektronik
  HANDY_TELEFON = "173",
  COMPUTER = "228",
  AUDIO_HIFI = "172",
  TV_VIDEO = "175",
  FOTO = "245",
  KONSOLEN = "227",

  // Sub-Kategorien Auto
  AUTOS = "216",
  MOTORRAEDER = "305",
  FAHRRAEDER = "217",
  E_SCOOTER = "303",
}
```

### Standort-Filter

| Parameter    | Typ      | Required | Default | Beschreibung                                     |
| ------------ | -------- | -------- | ------- | ------------------------------------------------ |
| `location`   | `string` | ❌       | -       | Ort oder PLZ                                     |
| `postalCode` | `string` | ❌       | -       | Postleitzahl (5-stellig)                         |
| `radius`     | `number` | ❌       | -       | Umkreis in km (5, 10, 20, 30, 50, 100, 150, 200) |

```typescript
// Validierung
const validRadii = [5, 10, 20, 30, 50, 100, 150, 200];
if (radius && !validRadii.includes(radius)) {
  throw new Error(`Invalid radius. Must be one of: ${validRadii.join(", ")}`);
}
```

### Preis-Filter

| Parameter   | Typ      | Required | Default | Beschreibung                                       |
| ----------- | -------- | -------- | ------- | -------------------------------------------------- |
| `minPrice`  | `number` | ❌       | -       | Mindestpreis in €                                  |
| `maxPrice`  | `number` | ❌       | -       | Maximalpreis in €                                  |
| `priceType` | `string` | ❌       | `"all"` | `"fixed"` \| `"negotiable"` \| `"free"` \| `"all"` |

### Sortierung

| Parameter | Typ      | Required | Default       | Beschreibung |
| --------- | -------- | -------- | ------------- | ------------ |
| `sortBy`  | `string` | ❌       | `"relevance"` | Sortierung   |

```typescript
enum SortOption {
  RELEVANCE = "RELEVANCE", // Standard
  NEWEST = "SORTING_DATE", // Neueste zuerst
  PRICE_ASC = "PRICE_AMOUNT", // Preis aufsteigend
  PRICE_DESC = "PRICE_AMOUNT_DESC", // Preis absteigend
}
```

### Artikel-Zustand

| Parameter   | Typ      | Required | Default | Beschreibung         |
| ----------- | -------- | -------- | ------- | -------------------- |
| `condition` | `string` | ❌       | `"all"` | Zustand des Artikels |

```typescript
enum ArticleCondition {
  ALL = "all",
  NEW = "new", // Neu
  USED = "used", // Gebraucht
  DEFECTIVE = "defective", // Defekt
}
```

### Angebots-Typ

| Parameter     | Typ       | Required | Default | Beschreibung     |
| ------------- | --------- | -------- | ------- | ---------------- |
| `offerType`   | `string`  | ❌       | `"all"` | Art des Angebots |
| `hasShipping` | `boolean` | ❌       | -       | Nur mit Versand  |

```typescript
enum OfferType {
  ALL = "all",
  OFFER = "s-angebot", // Angebot
  WANTED = "s-gesuch", // Gesuch
}
```

### Bild-Filter

| Parameter   | Typ       | Required | Default | Beschreibung             |
| ----------- | --------- | -------- | ------- | ------------------------ |
| `hasImages` | `boolean` | ❌       | -       | Nur Anzeigen mit Bildern |

### Verkäufer-Filter

| Parameter    | Typ       | Required | Default | Beschreibung                             |
| ------------ | --------- | -------- | ------- | ---------------------------------------- |
| `sellerType` | `string`  | ❌       | `"all"` | `"private"` \| `"commercial"` \| `"all"` |
| `topSeller`  | `boolean` | ❌       | -       | Nur Top-Verkäufer                        |

### Detail-Optionen

| Parameter           | Typ       | Required | Default | Beschreibung                    |
| ------------------- | --------- | -------- | ------- | ------------------------------- |
| `includeDetails`    | `boolean` | ❌       | `false` | Artikel-Beschreibung mitscrapen |
| `includeImages`     | `boolean` | ❌       | `true`  | Alle Bilder-URLs holen          |
| `includeSellerInfo` | `boolean` | ❌       | `false` | Verkäufer-Details holen         |
| `downloadImages`    | `boolean` | ❌       | `false` | Bilder lokal speichern          |

### Werbe-Handling

| Parameter | Typ       | Required | Default | Beschreibung                         |
| --------- | --------- | -------- | ------- | ------------------------------------ |
| `skipAds` | `boolean` | ❌       | `true`  | Werbeanzeigen überspringen           |
| `markAds` | `boolean` | ❌       | `false` | Werbung markieren statt überspringen |

### Output-Format

| Parameter      | Typ      | Required | Default  | Beschreibung                              |
| -------------- | -------- | -------- | -------- | ----------------------------------------- |
| `outputFormat` | `string` | ❌       | `"full"` | `"full"` \| `"minimal"` \| `"count_only"` |

---

## 📤 Response Schema

### Artikel-Objekt (`SearchArticle`)

```typescript
interface SearchArticle {
  // Basis-Infos
  id: string; // Kleinanzeigen Artikel-ID
  title: string; // Titel
  url: string; // Direkt-Link

  // Preis
  price: number | null; // Preis in €
  priceRaw: string; // Original-String ("150 € VB")
  priceType: "fixed" | "negotiable" | "free" | "on_request";

  // Standort
  location: string; // Stadt/Ort
  postalCode?: string; // PLZ wenn verfügbar

  // Zeit
  createdAt: string; // ISO Date wann hochgeladen
  createdAtRelative: string; // "Heute, 14:30" oder "Gestern"

  // Bilder
  thumbnailUrl: string; // Vorschaubild
  images: string[]; // Alle Bild-URLs (wenn includeImages=true)
  imageCount: number; // Anzahl Bilder

  // Details (wenn includeDetails=true)
  description?: string; // Vollständige Beschreibung

  // Versand
  hasShipping: boolean; // Versand möglich

  // Verkäufer (wenn includeSellerInfo=true)
  seller?: {
    id: string;
    name: string;
    type: "private" | "commercial";
    isTopSeller: boolean;
    memberSince: string; // "Aktiv seit Jan 2020"
    activeListings: number; // Anzahl aktiver Anzeigen
    profileUrl: string;
  };

  // Meta
  isAd: boolean; // Ist Werbeanzeige
  viewCount?: number; // Aufrufe (wenn verfügbar)
}
```

### Response (`SearchResult`)

```typescript
interface SearchResult {
  success: boolean;

  // Meta
  query: string;
  filters: AppliedFilters; // Angewendete Filter

  // Statistik
  totalAvailable: number; // Gesamt verfügbar
  totalPages: number; // Anzahl Seiten
  pagesScraped: number; // Tatsächlich gescrapt
  articlesScraped: number; // Artikel gescrapt
  adsSkipped: number; // Übersprungene Werbungen

  // Ergebnisse
  articles: SearchArticle[];

  // URLs
  searchUrl: string; // Konstruierte Such-URL

  // Timing
  scrapedAt: string; // ISO Timestamp
  scrapeDurationMs: number; // Dauer in ms

  // Fehler
  error?: string;
  warnings?: string[]; // z.B. "Some pages failed to load"
}
```

---

## 🔧 Beispiel-Requests

### Einfache Suche

```bash
POST /search
{
  "query": "iPhone 13"
}
```

### Erweiterte Suche

```bash
POST /search
{
  "query": "BMW 3er",
  "categoryId": "216",
  "location": "Berlin",
  "radius": 50,
  "minPrice": 5000,
  "maxPrice": 15000,
  "condition": "used",
  "sellerType": "private",
  "sortBy": "SORTING_DATE",
  "count": 25,
  "includeDetails": true,
  "includeSellerInfo": true
}
```

### Nur Anzahl ermitteln

```bash
GET /search/count?q=PlayStation%205&location=Hamburg
```

Response:

```json
{
  "success": true,
  "query": "PlayStation 5",
  "totalAvailable": 342,
  "searchUrl": "https://www.kleinanzeigen.de/s-...",
  "scrapedAt": "2024-12-12T21:00:00Z"
}
```

---

## ⚠️ Werbung-Erkennung

Werbung wird erkannt durch:

1. **CSS-Klasse**: `ad-listitem--has-sponsored-badge`
2. **Attribut**: `data-ad-type="sponsored"`
3. **Text**: "Anzeige" Badge
4. **URL-Pattern**: Enthält `/a-anzeige/` statt `/s-anzeige/`

```typescript
function isAdListing(element: Element): boolean {
  // Prüft alle Indikatoren
  return (
    element.classList.contains("ad-listitem--has-sponsored-badge") ||
    element.getAttribute("data-ad-type") === "sponsored" ||
    element.querySelector(".icon-badge-label-sponsored") !== null
  );
}
```

---

## 🌍 Sprach-unabhängiges Scraping

**WICHTIG:** Kleinanzeigen kann auf verschiedene Sprachen eingestellt werden!

### ❌ Nicht machen - Text-Matching:

```typescript
// SCHLECHT - Funktioniert nur auf Deutsch!
if (element.textContent?.includes("Privat")) { ... }
if (element.textContent?.includes("Top-Verkäufer")) { ... }
```

### ✅ Richtig - CSS-Klassen & data-Attribute:

```typescript
// GUT - Funktioniert in jeder Sprache!
if (element.classList.contains("userbadge-private")) { ... }
if (element.querySelector("[data-testid='top-seller-badge']")) { ... }
```

### CSS-Selektoren Referenz

| Element           | CSS-Selektor                                                      | Beschreibung    |
| ----------------- | ----------------------------------------------------------------- | --------------- |
| Verkäufer-Box     | `[data-testid="seller-info"]`, `.userprofile-vip`                 | Container       |
| Verkäufer-Name    | `.userprofile-vip a`, `[data-testid="seller-name"]`               | Name            |
| Typ Privat        | `.userbadge-private`, `[data-user-type="private"]`                | Privat          |
| Typ Gewerblich    | `.userbadge-commercial`, `[data-user-type="commercial"]`          | Gewerblich      |
| Top-Seller        | `.badge-topseller`, `[data-testid="top-seller"]`                  | Badge           |
| Bewertung Positiv | `.userbadge-positive`                                             | Grün/Freundlich |
| Bewertung Neutral | `.userbadge-neutral`                                              | Gelb/OK         |
| Bewertung Negativ | `.userbadge-negative`                                             | Rot/Schlecht    |
| Werbung           | `.ad-listitem--has-sponsored-badge`, `[data-ad-type="sponsored"]` | Sponsored       |
| Preis             | `[data-testid="price"]`, `.aditem-main--middle--price`            | Preis-Element   |
| Versand-Badge     | `.icon-shipping`, `[data-testid="shipping-badge"]`                | Versand möglich |

---

## 🚀 Implementierungs-Schritte

1. [x] **Types erstellen** (`src/types/search.types.ts`) ✅
2. [x] **Kategorie-Enum** mit allen IDs ✅
3. [x] **URL-Builder** für Such-Parameter ✅
4. [ ] **Parser** für Artikel-Elemente
5. [ ] **Werbe-Erkennung** implementieren
6. [ ] **Seller-Info Scraper** (extra Request pro Artikel)
7. [ ] **Bild-Downloader** (optional)
8. [ ] **Count-Only Endpoint**
9. [ ] **Input-Validierung** (Zod Schema)
10. [ ] **Tests** schreiben

---

## 📊 Rate-Limiting Strategie

- Max 1 Request pro Sekunde an Kleinanzeigen
- Delay zwischen Seiten: 1-3 Sekunden (random)
- Max 10 Seiten pro Suche (außer scrapeAll)
- Timeout pro Seite: 10 Sekunden
