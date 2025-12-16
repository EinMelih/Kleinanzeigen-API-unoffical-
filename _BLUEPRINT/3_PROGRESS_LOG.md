# 📝 Progress Log - Kleinanzeigen API

> Chronologisches Changelog aller Änderungen

---

### [16.12.2024] - Article Endpoint & Endpoint Tests ✅

- ✅ **Neuer Endpoint: `GET /article/:id`**

  - Scrapt einzelnen Artikel anhand ID
  - `?download=true` für Bild-Download
  - Vollständige Seller-Daten (ratingText, activeSince, activeListings)

- ✅ **Endpoint Tests durchgeführt:**

  | Endpoint | Status |
  |----------|--------|
  | `GET /article/:id` | ✅ Funktioniert |
  | `GET /article/:id?download=true` | ✅ Funktioniert |
  | `GET /search?q=...` | ✅ Funktioniert |
  | `POST /search` mit `includeDetails` | ✅ Funktioniert |
  | `POST /scrape` | ⚠️ Chrome-Timeout |

- ✅ **Ordnerstruktur in `data/images/search/`:**
  ```
  article_{ID}_{DATUM}/
  └── {Titel}_{ID}/
      ├── article-info.json
      └── image_X.jpg
  ```

---


- ✅ **SearchParser & SearchScraper Refactoring:**

  - `SearchScraper` nutzt jetzt `SearchParser` für Seller-Infos (modular!)
  - Keine duplizierte Seller-Logik mehr
  - `scrapeArticleDetails()` holt jetzt vollständige Seller-Daten

- ✅ **Erweiterte Seller-Informationen (`search-parser.service.ts`):**

  - Neue Helper-Methoden hinzugefügt:
    - `extractRatingText()` - "Freundlich", "OK Zufriedenheit", "TOP Zufriedenheit"
    - `extractMemberSince()` - "Aktiv seit DD.MM.YYYY"
    - `extractResponseTime()` - "Antwortet innerhalb von X Stunden"
    - `extractFollowerCount()` - Follower-Anzahl
    - `extractActiveListingsFromAllAdsLink()` - Anzahl aktiver Anzeigen

- ✅ **Types erweitert (`search.types.ts`):**

  - `ratingText` zu `SellerInfo` Interface hinzugefügt
  - Alle optionalen Felder mit `| undefined` für exactOptionalPropertyTypes

- 📋 **Seller-Daten die jetzt gescraped werden:**

  | Feld | Beispiel |
  |------|----------|
  | `name` | "R. Khal" |
  | `rating` | `friendly` / `ok` |
  | `ratingText` | "Freundlich" / "OK Zufriedenheit" |
  | `memberSince` | "28.01.2021" |
  | `responseTime` | "Antwortet in der Regel innerhalb von 1 Stunde" |
  | `followerCount` | 1 |
  | `activeListings` | 5 |

---

### [13.12.2024] - Such-Ordner & Dokumentation 📁

- ✅ **Such-Ordner Struktur implementiert:**

  - Bilder werden jetzt organisiert gespeichert in: `data/images/search/{Query}_{Ort}_{Radius}km_{Anzahl}pc_{Datum}/`
  - Beispiel: `data/images/search/iPhone_15_Köln_70km_40pc_2024-12-13/`
  - Response enthält `imageFolder` Pfad

- ✅ **Bild-Deduplizierung:**

  - Bilder werden anhand ihrer UUID dedupliziert
  - Keine Thumbnails/Full-Size Duplikate mehr

- ✅ **Dokumentation komplett überarbeitet:**
  - `todos/SEARCH.md` neu geschrieben
  - Junior-freundlich & kompakt
  - Copy-Paste Beispiele

---

### [12.12.2024] - Bild-Download & Scrape-Endpoint 📷

- ✅ **Erstellt: `src/services/image-downloader.service.ts`**

  - `downloadImages()` - Mehrere Bilder downloaden
  - `downloadSingleImage()` - Einzelnes Bild speichern
  - Bilder werden in `data/images/{artikel-id}/` gespeichert
  - Gibt sowohl URL als auch lokalen Pfad zurück

- ✅ **Neuer Endpoint: `POST /scrape`**

  - Array von Artikel-URLs direkt eingeben
  - Jeder Artikel wird gescraped mit: Titel, Preis, Beschreibung, Bilder, Seller
  - Optional: `downloadImages: true` für lokale Bild-Speicherung
  - Max 50 URLs pro Request

- ✅ **Search-Endpoints erweitert:**

  - `GET /search?download=true` - Mit Bild-Download
  - `POST /search` mit `downloadImages: true`
  - Response enthält `downloadedImages: [{ url, localPath }]`

- 📝 **SEARCH.md aktualisiert** mit:
  - Scrape-Endpoint Dokumentation
  - Bild-Download Beispiele
  - curl-Befehle zum Testen

---

### [12.12.2024] - Search Parser Service erstellt 🔧

- ✅ **Erstellt: `src/services/search-parser.service.ts`** (452 Zeilen)

  - `parseSearchResults()` - Alle Artikel von Suchseite extrahieren
  - `parseArticleElement()` - Einzelnen Artikel parsen
  - `parseSellerInfo()` - Verkäufer-Details von Detail-Seite
  - `collectSellerBadges()` - Badges sammeln
  - `parseSellerRating()` - Bewertung erkennen

- 📋 **CSS-Selektoren definiert:**

  - 25+ Selektoren für alle Elemente
  - Sprach-unabhängig (CSS-Klassen statt Text)
  - Fallback-Selektoren für Robustheit

- ⚠️ **Datei > 300 Zeilen:** Akzeptabel weil eine klare Verantwortung (Parsing)

---

### [12.12.2024] - Seller Types erweitert + Sprach-unabhängig 🌍

- ✅ **Neue Enums hinzugefügt:**

  - `SellerRating` - Bewertungs-Level (friendly, ok, bad)
  - `SellerBadge` - Auszeichnungen (top_seller, verified, pro, fast_reply)

- ✅ **SellerInfo erweitert:**

  - `isVerified` - Verifizierter Account
  - `badges[]` - Array aller Badges
  - `rating` - Freundlichkeits-Bewertung
  - `ratingCount` - Anzahl Bewertungen
  - `positiveRatingPercent` - Prozent positiv
  - `followerCount` - Follower (für Pro/Shops)

- 🌍 **Sprach-unabhängiges Scraping dokumentiert:**

  - CSS-Klassen statt Text-Matching verwenden
  - `data-testid` Attribute nutzen
  - Funktioniert egal welche Sprache eingestellt ist

- 📝 **SEARCH.md aktualisiert** mit CSS-Selektoren Referenz

---

### [12.12.2024] - Search Types erstellt 📦

- ✅ **Erstellt: `src/types/search.types.ts`** (vollständig dokumentiert)

  - Alle **14 Haupt-Kategorien** mit IDs (c210, c161, c80, etc.)
  - **Elektronik** Unterkategorien (c172-c285)
  - **Auto, Rad & Boot** Unterkategorien (c216-c280)
  - Alle Filter-Enums (`SellerType`, `ArticleCondition`, etc.)
  - `SearchOptions` Interface für Requests
  - `SearchArticle` Interface für Artikel
  - `SellerInfo` Interface für Verkäufer-Details
  - `SearchResult` Interface für Response
  - `buildSearchUrl()` Helper-Funktion

- 📝 Jeder Wert hat JSDoc-Kommentar mit URL-Format
- 🔄 `src/types/index.ts` erstellt für Exports

---

### [12.12.2024] - Kleinanzeigen URL-Struktur analysiert 🔍

- 🌐 **Browser-Agent Analyse durchgeführt:**

  - Kleinanzeigen nutzt **KEINE Query-Parameter** (`?key=value`)
  - Alle Filter sind **Pfad-basiert**: `/anbieter:privat/zustand:gebraucht/...`
  - Kategorie/Ort/Radius am Ende: `k0l0r10` (k=Kategorie, l=Ort, r=Radius)

- ✅ **Entdeckte Filter:**

  - `anbieter:privat` / `anbieter:gewerblich`
  - `zustand:neu` / `zustand:gebraucht`
  - `anzeige:angebote` / `anzeige:gesuche`
  - `versand:ja` / `versand:nein`
  - `vb-preis` (Verhandlungsbasis)
  - Radius: `r5`, `r10`, `r20`, `r30`, `r50`, `r100`, `r150`, `r200`

- 📝 **SEARCH.md aktualisiert** mit echten URL-Beispielen

---

### [12.12.2024] - Cleanup & Duplikat-Entfernung

- 🗑️ **Gelöscht:**

  - `src/server/server.ts` (1124 Zeilen) → Ersetzt durch `src/server/index.ts`
  - `src/services/cookieValidator.ts` (472 Zeilen) → **Duplikat** von `cookies-validation.ts`

- 📊 **Analyse durchgeführt:**

  - `cookieValidator.ts` und `cookies-validation.ts` waren praktisch identisch
  - Nur `cookies-validation.ts` wurde importiert → anderes gelöscht

- 🧠 **Entscheidung zu Service-Dateien > 300 Zeilen:**

  Folgende Dateien bleiben **bewusst > 300 Zeilen**:

  | Datei                           | Zeilen | Begründung                                                                  |
  | ------------------------------- | ------ | --------------------------------------------------------------------------- |
  | `cookies-validation.ts`         | 469    | Eine Klasse mit klar getrennten Methoden. Aufteilen würde Kontext zerreißen |
  | `auth-login.ts`                 | 437    | Login-Workflow ist ein zusammenhängender Prozess                            |
  | `email-verification.ts`         | 392    | IMAP-Handling ist komplex, gehört zusammen                                  |
  | `email-verification-browser.ts` | 348    | Browser-basierte Verifizierung, eigene Verantwortung                        |
  | `search-scraper.ts`             | 623    | **Wird aufgeteilt** wenn Search erweitert wird                              |

  **Philosophie:** Die 300-Zeilen-Regel ist ein Richtwert, kein Gesetz.
  Eine gut strukturierte 400-Zeilen-Datei mit einer Klasse ist besser als
  4 verstreute 100-Zeilen-Dateien die zusammengehören.

---

### [12.12.2024] - Major Refactoring: Code Cleanup ✅

- ✅ **Done:**

  - `_BLUEPRINT/` Ordner erstellt mit 3 Kern-Dateien
  - `server.ts` (1125 Zeilen) aufgeteilt in:
    - `routes/auth.routes.ts` (230 Zeilen)
    - `routes/cookies.routes.ts` (285 Zeilen)
    - `routes/oauth.routes.ts` (210 Zeilen)
    - `routes/tokens.routes.ts` (32 Zeilen)
    - `routes/search.routes.ts` (120 Zeilen)
    - `routes/index.ts` (8 Zeilen)
    - `server/index.ts` (96 Zeilen) ← neuer Entry Point
  - MDs konsolidiert:
    - `API_REFERENCE.md` → `docs/`
    - `GETTING_STARTED.md` → `docs/`
    - `Blueprint.md` → `docs/FEATURE_ROADMAP.md`
    - `IMPLEMENTATION_PLAN.md` gelöscht (veraltet)
  - `todos/SEARCH.md` erstellt mit vollständiger Spezifikation
  - `package.json` aktualisiert für neuen Entry Point

- ⏭️ **Next:**
  - Search Endpoint nach `todos/SEARCH.md` implementieren
  - Parameter auf Kleinanzeigen.de verifizieren

---

### [Vorher] - Initial State

- Monolithische `server.ts` mit allen Endpoints
- Keine Dokumentation
- Keine klare Trennung von Concerns
- Duplikate vorhanden (`cookieValidator.ts` / `cookies-validation.ts`)
