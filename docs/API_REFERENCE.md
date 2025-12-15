# 📡 Kleinanzeigen API - Referenz

> **Alle Endpoints:** Siehe [docs/ENDPOINTS.md](./ENDPOINTS.md)

---

## 🚀 Backend starten

```powershell
# 1. Abhängigkeiten installieren
bun install

# 2. TypeScript kompilieren
bun run build

# 3. Server starten (Port 87)
bun start

# Entwicklung mit Hot-Reload:
bun run dev:watch
```

---

## 🔧 Typische Workflows

### Login-Prozess

```powershell
# 1. Login durchführen
$body = @{
    email = "deine@email.de"
    password = "dein_passwort"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:87/auth/login" `
    -Method POST -Body $body -ContentType "application/json"

# 2. Falls 2FA nötig
if ($result.requires2FA) {
    $verifyBody = @{
        email = "deine@email.de"
        emailPassword = "email_passwort"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:87/auth/verify-email" `
        -Method POST -Body $verifyBody -ContentType "application/json"
}

# 3. Status prüfen
Invoke-RestMethod -Uri "http://localhost:87/auth/status/deine@email.de"
```

### Suche durchführen

```powershell
$body = @{
    query = "iPhone 15"
    count = 10
    location = "Köln"
    downloadImages = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/search" `
    -Method POST -Body $body -ContentType "application/json"
```

### Artikel direkt scrapen

```powershell
$body = @{
    urls = @(
        "https://www.kleinanzeigen.de/s-anzeige/.../123456-173"
    )
    downloadImages = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:87/scrape" `
    -Method POST -Body $body -ContentType "application/json"
```

---

**Letzte Aktualisierung:** 15.12.2024
