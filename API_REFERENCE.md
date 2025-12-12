# 📡 Kleinanzeigen API - Referenz

Diese Dokumentation beschreibt alle verfügbaren API-Endpunkte.

---

## 🚀 Backend starten

```powershell
# 1. Abhängigkeiten installieren (nur beim ersten Mal)
bun install

# 2. TypeScript kompilieren
bun run build

# 3. Server starten (läuft auf http://localhost:87)
bun start

# Oder für Entwicklung mit Hot-Reload:
bun run dev:watch
```

---

## 📋 Alle API-Endpunkte

**Base URL:** `http://localhost:87`

---

## 🔐 Authentifizierung (`/auth`)

### 1. Login durchführen
**`POST /auth/login`** - Führt einen Login bei Kleinanzeigen durch

```powershell
# PowerShell
$body = @{
    email = "deine@email.de"
    password = "dein_passwort"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

```bash
# cURL
curl -X POST http://localhost:87/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deine@email.de", "password":"dein_passwort"}'
```

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `email` | string | ✅ | Kleinanzeigen E-Mail |
| `password` | string | ❌ | Passwort (aus .env wenn nicht angegeben) |

---

### 2. E-Mail Verifizierung (2FA)
**`POST /auth/verify-email`** - Automatische E-Mail-Verifizierung für 2FA

```powershell
$body = @{
    email = "deine@email.de"
    emailPassword = "dein_email_passwort"
    timeout = 60000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/auth/verify-email" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

```bash
curl -X POST http://localhost:87/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"deine@email.de", "emailPassword":"email_passwort", "timeout": 60000}'
```

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `email` | string | ✅ | E-Mail Adresse |
| `emailPassword` | string | ✅ | IMAP Passwort für E-Mail |
| `timeout` | number | ❌ | Timeout in ms (Standard: 60000) |

---

### 3. Login-Status prüfen (Echtzeit)
**`POST /auth/check-login`** - Prüft ob ein Benutzer aktuell eingeloggt ist

```powershell
$body = @{ email = "deine@email.de" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/auth/check-login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

```bash
curl -X POST http://localhost:87/auth/check-login \
  -H "Content-Type: application/json" \
  -d '{"email":"deine@email.de"}'
```

---

### 4. Status für bestimmten Benutzer
**`GET /auth/status/:email`** - Login-Status für einen Benutzer abrufen

```powershell
Invoke-RestMethod -Uri "http://localhost:87/auth/status/deine@email.de"
```

```bash
curl http://localhost:87/auth/status/deine@email.de
```

---

### 5. Alle Benutzer anzeigen
**`GET /auth/users`** - Zeigt alle Benutzer und deren Auth-Status

```powershell
Invoke-RestMethod -Uri "http://localhost:87/auth/users"
```

```bash
curl http://localhost:87/auth/users
```

---

## 🍪 Cookies (`/cookies`)

### 1. Cookie-Statistiken
**`GET /cookies/stats`** - Übersicht aller gespeicherten Cookies

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/stats"
```

```bash
curl http://localhost:87/cookies/stats
```

---

### 2. Ablaufende Cookies
**`GET /cookies/expiring`** - Zeigt Cookies die bald ablaufen

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/expiring"
```

---

### 3. Cookie-Validierung
**`POST /cookies/validate`** - Validiert alle Cookies

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/validate" -Method POST
```

---

### 4. Cookie Cleanup
**`POST /cookies/cleanup`** - Löscht abgelaufene Cookies

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/cleanup" -Method POST
```

---

### 5. Cookies testen für Benutzer
**`POST /cookies/test/:email`** - Testet Cookies eines bestimmten Benutzers

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/test/deine@email.de" -Method POST
```

```bash
curl -X POST http://localhost:87/cookies/test/deine@email.de
```

---

### 6. Cookie-Details abrufen
**`GET /cookies/details/:email`** - Detaillierte Cookie-Infos für einen Benutzer

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/details/deine@email.de"
```

---

### 7. Cookies aktualisieren
**`POST /cookies/refresh/:email`** - Aktualisiert Cookies eines Benutzers

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/refresh/deine@email.de" -Method POST
```

---

### 8. Refresh-Status prüfen
**`GET /cookies/refresh-status`** - Prüft ob Cookies erneuert werden müssen

```powershell
# Mit optionalem Threshold (Stunden)
Invoke-RestMethod -Uri "http://localhost:87/cookies/refresh-status?threshold=6"
```

---

### 9. Auto-Refresh starten
**`POST /cookies/auto-refresh/start`** - Startet automatisches Cookie-Refresh

```powershell
$body = @{ interval = 4 } | ConvertTo-Json  # Interval in Stunden
Invoke-RestMethod -Uri "http://localhost:87/cookies/auto-refresh/start" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

### 10. Auto-Refresh stoppen
**`POST /cookies/auto-refresh/stop`** - Stoppt automatisches Cookie-Refresh

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/auto-refresh/stop" -Method POST
```

---

### 11. Auto-Refresh Status
**`GET /cookies/auto-refresh/status`** - Status des Auto-Refresh-Dienstes

```powershell
Invoke-RestMethod -Uri "http://localhost:87/cookies/auto-refresh/status"
```

---

## 🔑 Tokens (`/tokens`)

### Token-Analyse
**`GET /tokens/analyze/:email`** - Analysiert JWT-Tokens eines Benutzers

```powershell
Invoke-RestMethod -Uri "http://localhost:87/tokens/analyze/deine@email.de"
```

```bash
curl http://localhost:87/tokens/analyze/deine@email.de
```

---

## 🖥️ Server-Steuerung (`/server`)

### 1. Chrome-Browser starten
**`POST /server/start`** - Startet Chrome mit Remote-Debugging

```powershell
$body = @{ email = "deine@email.de" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:87/server/start" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

### 2. Chrome-Browser stoppen
**`POST /server/stop`** - Stoppt den Chrome-Browser

```powershell
Invoke-RestMethod -Uri "http://localhost:87/server/stop" -Method POST
```

---

### 3. Server-Status
**`GET /server/status`** - Prüft ob Chrome läuft

```powershell
Invoke-RestMethod -Uri "http://localhost:87/server/status"
```

---

## ❤️ Health Check

### Server-Gesundheit prüfen
**`GET /health`** - Prüft ob der Server läuft

```powershell
Invoke-RestMethod -Uri "http://localhost:87/health"
```

```bash
curl http://localhost:87/health
```

---

## 📝 Schnellreferenz - Alle Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/health` | Server-Gesundheit prüfen |
| `POST` | `/auth/login` | Login durchführen |
| `POST` | `/auth/verify-email` | E-Mail für 2FA verifizieren |
| `POST` | `/auth/check-login` | Login-Status (Echtzeit) |
| `GET` | `/auth/status/:email` | Status eines Benutzers |
| `GET` | `/auth/users` | Alle Benutzer anzeigen |
| `GET` | `/cookies/stats` | Cookie-Statistiken |
| `GET` | `/cookies/expiring` | Ablaufende Cookies |
| `POST` | `/cookies/validate` | Cookies validieren |
| `POST` | `/cookies/cleanup` | Abgelaufene Cookies löschen |
| `POST` | `/cookies/test/:email` | Cookies testen |
| `GET` | `/cookies/details/:email` | Cookie-Details |
| `POST` | `/cookies/refresh/:email` | Cookies aktualisieren |
| `GET` | `/cookies/refresh-status` | Refresh benötigt? |
| `POST` | `/cookies/auto-refresh/start` | Auto-Refresh starten |
| `POST` | `/cookies/auto-refresh/stop` | Auto-Refresh stoppen |
| `GET` | `/cookies/auto-refresh/status` | Auto-Refresh Status |
| `GET` | `/tokens/analyze/:email` | Token analysieren |
| `POST` | `/server/start` | Chrome starten |
| `POST` | `/server/stop` | Chrome stoppen |
| `GET` | `/server/status` | Chrome-Status |
| `POST` | `/search` | Artikel suchen & scrapen |
| `GET` | `/search?q=...` | Schnellsuche mit Query |

---

## 🔍 Suche & Scraping (`/search`)

### 1. Artikel suchen (POST)
**`POST /search`** - Sucht und scrapt Artikel von Kleinanzeigen

```powershell
# PowerShell - Einfache Suche
$body = @{
    query = "iPhone 15"
    count = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/search" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

```powershell
# PowerShell - Erweiterte Suche mit allen Optionen
$body = @{
    query = "MacBook Pro"
    count = 10
    location = "Berlin"
    radius = 50
    minPrice = 500
    maxPrice = 2000
    sortBy = "PRICE_AMOUNT"
    includeDetails = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/search" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

```bash
# cURL
curl -X POST http://localhost:87/search \
  -H "Content-Type: application/json" \
  -d '{"query":"iPhone 15", "count": 5}'
```

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `query` | string | ✅ | Suchbegriff |
| `count` | number | ❌ | Anzahl der Artikel (1-100, Standard: 10) |
| `location` | string | ❌ | Standort (z.B. "Berlin", "München") |
| `radius` | number | ❌ | Umkreis in km |
| `minPrice` | number | ❌ | Minimaler Preis in € |
| `maxPrice` | number | ❌ | Maximaler Preis in € |
| `sortBy` | string | ❌ | Sortierung: `SORTING_DATE`, `PRICE_AMOUNT`, `RELEVANCE` |
| `includeDetails` | boolean | ❌ | Holt zusätzlich Beschreibung & alle Bilder (langsamer) |

**Beispiel-Response:**
```json
{
  "status": "success",
  "success": true,
  "query": "iPhone 15",
  "totalFound": 5,
  "articlesScraped": 5,
  "articles": [
    {
      "id": "2849163857",
      "title": "iPhone 15 Pro 256GB Blau",
      "price": "950 €",
      "priceType": "negotiable",
      "location": "10115 Berlin Mitte",
      "date": "Heute, 14:32",
      "url": "https://www.kleinanzeigen.de/s-anzeige/...",
      "images": ["https://img.kleinanzeigen.de/..."],
      "thumbnailUrl": "https://img.kleinanzeigen.de/...",
      "seller": {
        "name": "Max M.",
        "type": "private"
      }
    }
  ],
  "searchUrl": "https://www.kleinanzeigen.de/s-suchanfrage.html?keywords=iPhone+15",
  "scrapedAt": "2025-12-12T16:00:00.000Z"
}
```

---

### 2. Schnellsuche (GET)
**`GET /search?q=...`** - Einfache Suche per URL-Parameter

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:87/search?q=PlayStation%205&count=3"
```

```bash
# cURL
curl "http://localhost:87/search?q=PlayStation%205&count=3"
```

| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|--------------|
| `q` | string | ✅ | Suchbegriff |
| `count` | string | ❌ | Anzahl der Artikel (Standard: 10) |
| `location` | string | ❌ | Standort |

---


## 🔧 Typische Workflows

### Login-Prozess (komplett)

```powershell
# 1. Server starten (falls nicht läuft)
bun start

# 2. Login durchführen
$loginBody = @{
    email = "deine@email.de"
    password = "dein_passwort"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:87/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json"

# 3. Falls 2FA nötig: E-Mail verifizieren
if ($result.requires2FA) {
    $verifyBody = @{
        email = "deine@email.de"
        emailPassword = "email_passwort"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:87/auth/verify-email" `
        -Method POST -Body $verifyBody -ContentType "application/json"
}

# 4. Login-Status prüfen
Invoke-RestMethod -Uri "http://localhost:87/auth/check-login" `
    -Method POST -Body (@{email="deine@email.de"} | ConvertTo-Json) `
    -ContentType "application/json"
```

---

**Letzte Aktualisierung:** 09.12.2025
