# 📡 API Endpoints

> **Server:** `http://localhost:87` > **Letzte Aktualisierung:** 15.12.2024

---

## Status-Legende

| Symbol | Bedeutung             |
| ------ | --------------------- |
| ✅     | Funktioniert          |
| ⚠️     | Teilweise / In Arbeit |
| ❌     | Nicht implementiert   |
| 🔜     | Geplant               |

---

## 📋 Übersicht aller Endpoints

### ❤️ Health

| Status | Methode | Endpoint  | Beschreibung         |
| ------ | ------- | --------- | -------------------- |
| ✅     | `GET`   | `/health` | Server-Status prüfen |

### 🔐 Auth (`/auth`)

| Status | Methode | Endpoint              | Beschreibung                   |
| ------ | ------- | --------------------- | ------------------------------ |
| ✅     | `POST`  | `/auth/login`         | Login bei Kleinanzeigen        |
| ✅     | `POST`  | `/auth/verify-email`  | 2FA E-Mail verifizieren        |
| ✅     | `POST`  | `/auth/check-login`   | Login-Status prüfen (Echtzeit) |
| ✅     | `GET`   | `/auth/status/:email` | Status eines Benutzers         |
| ✅     | `GET`   | `/auth/users`         | Alle Benutzer anzeigen         |

### 🍪 Cookies (`/cookies`)

| Status | Methode | Endpoint                       | Beschreibung                |
| ------ | ------- | ------------------------------ | --------------------------- |
| ✅     | `GET`   | `/cookies/stats`               | Cookie-Statistiken          |
| ✅     | `GET`   | `/cookies/status`              | Cookie-Validierungsstatus   |
| ✅     | `GET`   | `/cookies/expiring-soon`       | Ablaufende Cookies          |
| ✅     | `POST`  | `/cookies/cleanup`             | Abgelaufene Cookies löschen |
| ✅     | `POST`  | `/cookies/test/:email`         | Cookies testen              |
| ✅     | `GET`   | `/cookies/details/:email`      | Cookie-Details              |
| ✅     | `POST`  | `/cookies/refresh/:email`      | Cookies aktualisieren       |
| ✅     | `POST`  | `/cookies/refresh-all`         | Alle Cookies aktualisieren  |
| ✅     | `GET`   | `/cookies/refresh-status`      | Refresh benötigt?           |
| ✅     | `POST`  | `/cookies/auto-refresh/start`  | Auto-Refresh starten        |
| ✅     | `POST`  | `/cookies/auto-refresh/stop`   | Auto-Refresh stoppen        |
| ✅     | `GET`   | `/cookies/auto-refresh/status` | Auto-Refresh Status         |

### 🔑 Tokens (`/tokens`)

| Status | Methode | Endpoint                 | Beschreibung          |
| ------ | ------- | ------------------------ | --------------------- |
| ✅     | `GET`   | `/tokens/analyze/:email` | JWT Token analysieren |

### 🖥️ Server (`/server`)

| Status | Methode | Endpoint         | Beschreibung   |
| ------ | ------- | ---------------- | -------------- |
| ✅     | `POST`  | `/server/start`  | Chrome starten |
| ✅     | `POST`  | `/server/stop`   | Chrome stoppen |
| ✅     | `GET`   | `/server/status` | Chrome-Status  |

### 🔍 Search & Scrape (`/search`, `/scrape`)

| Status | Methode | Endpoint        | Beschreibung                 |
| ------ | ------- | --------------- | ---------------------------- |
| ✅     | `GET`   | `/search?q=...` | Schnellsuche                 |
| ✅     | `POST`  | `/search`       | Erweiterte Suche mit Filtern |
| ✅     | `POST`  | `/scrape`       | Artikel per URL(s) scrapen   |

---

## 🔍 Search Endpoints (Details)

### `POST /search`

```json
{
  "query": "iPhone 15",
  "count": 10,
  "location": "Köln",
  "radius": 50,
  "minPrice": 200,
  "maxPrice": 800,
  "sortBy": "SORTING_DATE",
  "includeDetails": false,
  "downloadImages": false,
  "scrapeAll": false
}
```

| Parameter        | Typ    | Pflicht | Default   | Beschreibung                   |
| ---------------- | ------ | ------- | --------- | ------------------------------ |
| `query`          | string | ✅      | -         | Suchbegriff                    |
| `count`          | number | ❌      | 10        | Anzahl (max 100)               |
| `location`       | string | ❌      | -         | Stadt/Ort                      |
| `radius`         | number | ❌      | -         | km (5,10,20,30,50,100,150,200) |
| `minPrice`       | number | ❌      | -         | Mindestpreis €                 |
| `maxPrice`       | number | ❌      | -         | Höchstpreis €                  |
| `sortBy`         | string | ❌      | RELEVANCE | `SORTING_DATE`, `PRICE_AMOUNT` |
| `includeDetails` | bool   | ❌      | false     | Details mitscrapen             |
| `downloadImages` | bool   | ❌      | false     | Bilder speichern               |
| `scrapeAll`      | bool   | ❌      | false     | Alle Seiten                    |

---

### `POST /scrape`

```json
{
  "urls": ["https://www.kleinanzeigen.de/s-anzeige/.../123456-173"],
  "downloadImages": true
}
```

| Parameter        | Typ      | Pflicht | Default | Beschreibung          |
| ---------------- | -------- | ------- | ------- | --------------------- |
| `urls`           | string[] | ✅      | -       | Artikel-URLs (max 50) |
| `downloadImages` | bool     | ❌      | false   | Bilder speichern      |

---

### `GET /search`

```
GET /search?q=iPhone&count=5&location=Berlin&download=true
```

| Parameter  | Typ    | Pflicht | Default |
| ---------- | ------ | ------- | ------- |
| `q`        | string | ✅      | -       |
| `count`    | string | ❌      | 10      |
| `location` | string | ❌      | -       |
| `download` | string | ❌      | false   |

---

## 📁 Bild-Download

Wenn `downloadImages: true`:

```
data/images/search/{Query}_{Ort}_{Radius}km_{Count}pc_{Datum}/
└── {Titel}_{ID}/
    ├── article-info.json
    ├── image_0.jpg
    └── image_1.jpg
```

**article-info.json:**

```json
{
  "id": "123456789",
  "title": "iPhone 15 Pro",
  "price": "850 € VB",
  "location": "50667 Köln",
  "url": "https://...",
  "description": "...",
  "date": "15.12.2024",
  "sellerName": "Max M.",
  "downloadedAt": "2024-12-15T21:00:00Z",
  "imageCount": 3
}
```

---

## � Hinweis

**`/article/:id` ist nicht nötig** - `/scrape` kann einzelne Artikel scrapen:

```json
POST /scrape
{
  "urls": ["https://www.kleinanzeigen.de/s-anzeige/iphone-15/123456789-173"],
  "downloadImages": true
}
```
