# 🔍 Search & Scrape API

> **Letzte Aktualisierung:** 13.12.2024
> **Server:** `http://localhost:87`

---

## 📋 Quick Reference

| Endpoint       | Beschreibung        | Body braucht          |
| -------------- | ------------------- | --------------------- |
| `GET /search`  | Schnelle Suche      | Query-Param: `?q=...` |
| `POST /search` | Erweiterte Suche    | `{"query": "..."}`    |
| `POST /scrape` | Direkt URLs scrapen | `{"urls": [...]}`     |

---

## 🚀 POST /search - Hauptsuche

### Basis-Request

```json
{
  "query": "iPhone 15"
}
```

### Vollständige Parameter

```json
{
  "query": "iPhone 15",
  "count": 40,
  "location": "Köln",
  "radius": 70,
  "minPrice": 200,
  "maxPrice": 800,
  "sortBy": "SORTING_DATE",
  "includeDetails": true,
  "downloadImages": true
}
```

### Parameter-Tabelle

| Parameter        | Typ    | Pflicht | Default   | Beschreibung                                |
| ---------------- | ------ | ------- | --------- | ------------------------------------------- |
| `query`          | string | ✅      | -         | Suchbegriff                                 |
| `count`          | number | ❌      | 10        | Anzahl Ergebnisse (max 100)                 |
| `location`       | string | ❌      | -         | Stadt/Ort                                   |
| `radius`         | number | ❌      | -         | Umkreis in km (5,10,20,30,50,100,150,200)   |
| `minPrice`       | number | ❌      | -         | Mindestpreis in €                           |
| `maxPrice`       | number | ❌      | -         | Höchstpreis in €                            |
| `sortBy`         | string | ❌      | RELEVANCE | `SORTING_DATE`, `PRICE_AMOUNT`, `RELEVANCE` |
| `includeDetails` | bool   | ❌      | false     | Beschreibung mitscrapen                     |
| `downloadImages` | bool   | ❌      | false     | Bilder lokal speichern                      |
| `scrapeAll`      | bool   | ❌      | false     | Alle Seiten scrapen                         |

### Beispiel-Response

```json
{
  "status": "success",
  "imageFolder": "data/images/search/iPhone_15_Köln_70km_40pc_2024-12-13",
  "result": {
    "success": true,
    "query": "iPhone 15",
    "totalAvailable": 1250,
    "articlesScraped": 40,
    "articles": [
      {
        "id": "123456789",
        "title": "iPhone 15 Pro 256GB",
        "price": "850 € VB",
        "location": "50667 Köln",
        "url": "https://www.kleinanzeigen.de/s-anzeige/...",
        "images": ["https://img.kleinanzeigen.de/..."],
        "downloadedImages": [
          {
            "url": "...",
            "localPath": "data/images/search/.../123456789/image_0.jpg"
          }
        ]
      }
    ]
  }
}
```

---

## 🎯 POST /scrape - Direkt URLs scrapen

### Request

```json
{
  "urls": [
    "https://www.kleinanzeigen.de/s-anzeige/iphone-15/123456789-173",
    "https://www.kleinanzeigen.de/s-anzeige/samsung/987654321-173"
  ],
  "downloadImages": true
}
```

### Parameter

| Parameter        | Typ      | Pflicht | Default | Beschreibung                    |
| ---------------- | -------- | ------- | ------- | ------------------------------- |
| `urls`           | string[] | ✅      | -       | Array von Artikel-URLs (max 50) |
| `downloadImages` | bool     | ❌      | false   | Bilder lokal speichern          |

### Response

```json
{
  "status": "success",
  "totalUrls": 2,
  "successfulScrapes": 2,
  "failedScrapes": 0,
  "results": [
    {
      "url": "https://...",
      "success": true,
      "article": {
        "id": "123456789",
        "title": "iPhone 15 Pro",
        "price": "850 € VB",
        "description": "Verkaufe mein iPhone...",
        "location": "50667 Köln",
        "images": ["..."],
        "downloadedImages": [{ "url": "...", "localPath": "..." }],
        "seller": {
          "name": "Max M.",
          "profileUrl": "/s-bestandsliste.html?userId=12345"
        }
      }
    }
  ]
}
```

---

## ⚡ GET /search - Quick Search

```bash
curl "http://localhost:87/search?q=iPhone&count=5&location=Berlin"
```

| Parameter  | Beschreibung             |
| ---------- | ------------------------ |
| `q`        | Suchbegriff (required)   |
| `count`    | Anzahl (default: 10)     |
| `location` | Ort                      |
| `download` | `true` für Bild-Download |

---

## 📁 Bild-Download Ordnerstruktur

Wenn `downloadImages: true`:

```
data/images/search/
└── iPhone_15_Köln_70km_40pc_2024-12-13/
    ├── 123456789/
    │   ├── image_0.jpg
    │   └── image_1.jpg
    ├── 987654321/
    │   └── image_0.jpg
    └── ...
```

**Format:** `{Query}_{Ort}_{Radius}km_{Anzahl}pc_{Datum}`

---

## 🔧 Postman Setup

1. **Method:** `POST`
2. **URL:** `http://localhost:87/search` oder `/scrape`
3. **Headers:** `Content-Type: application/json`
4. **Body:** Raw → JSON

---

## ⚠️ Häufige Fehler

| Fehler                                     | Ursache                | Lösung                                              |
| ------------------------------------------ | ---------------------- | --------------------------------------------------- |
| `body must have required property 'query'` | Falsche URL            | `/search` braucht `query`, `/scrape` braucht `urls` |
| `Port 87 in use`                           | Server läuft schon     | `npx kill-port 87`                                  |
| `Could not connect to Chrome`              | Chrome nicht gestartet | Chrome manuell öffnen                               |

---

## 📋 Beispiele für Copy-Paste

### iPhone 15 in Köln, 40 Ergebnisse, mit Bildern

```json
{
  "query": "iPhone 15",
  "count": 40,
  "location": "Köln",
  "radius": 70,
  "downloadImages": true
}
```

### PlayStation 5, günstig, neuste zuerst

```json
{
  "query": "PlayStation 5",
  "count": 20,
  "minPrice": 300,
  "maxPrice": 450,
  "sortBy": "SORTING_DATE"
}
```

### Mehrere Artikel direkt scrapen

```json
{
  "urls": [
    "https://www.kleinanzeigen.de/s-anzeige/artikel-1/111111111-173",
    "https://www.kleinanzeigen.de/s-anzeige/artikel-2/222222222-173"
  ],
  "downloadImages": true
}
```
