# 🚀 Schnellstart-Anleitung | Kleinanzeigen API

Diese Anleitung zeigt dir, wie du das Projekt mit **Bun** (empfohlen) oder npm verwendest.

---

## 📦 Voraussetzungen

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **Bun** (empfohlen) | 1.0+ | [bun.sh](https://bun.sh) |
| **Chrome** | Aktuell | [chrome.com](https://www.google.com/chrome) |

---

## ⚡ Bun Installation (Windows)

```powershell
# Bun installieren
powershell -c "irm bun.sh/install.ps1 | iex"

# Terminal neu starten, dann testen
bun --version
```

---

## 🔧 Projekt Setup

### Mit Bun (empfohlen) ⚡

```powershell
# 1. Repository klonen
git clone <repository-url>
cd Kleinanzeigen-API-unoffical-

# 2. Abhängigkeiten installieren (~7 Sekunden)
bun install

# 3. TypeScript kompilieren
bun run build

# 4. Server starten
bun start
```

### Mit npm (Alternative)

```powershell
# Abhängigkeiten installieren
npm install

# TypeScript kompilieren
npm run build

# Server starten
npm start
```

---

## 📋 Verfügbare Befehle

| Befehl | Bun | npm | Beschreibung |
|--------|-----|-----|--------------|
| **Installieren** | `bun install` | `npm install` | Abhängigkeiten installieren |
| **Bauen** | `bun run build` | `npm run build` | TypeScript kompilieren |
| **Starten** | `bun start` | `npm start` | Produktionsserver starten |
| **Entwicklung** | `bun run dev` | `npm run dev` | Dev-Server mit ts-node |
| **Dev (Watch)** | `bun run dev:watch` | `npm run dev:watch` | Mit Hot-Reload |
| **Aufräumen** | `bun run clean` | `npm run clean` | dist/ Ordner löschen |

---

## ⚙️ Konfiguration

### 1. Environment-Datei erstellen

Erstelle eine `.env` Datei im Hauptverzeichnis:

```env
# Server-Port
PORT=87

# Kleinanzeigen Passwort
KLEINANZEIGEN_PASSWORD=dein_passwort_hier

# Chrome WebSocket Endpoint (optional, wird automatisch erkannt)
CHROME_WS_ENDPOINT=ws://localhost:9222/devtools/browser/...

# Debug-Modus (optional)
DEBUG=false
LOG_LEVEL=info
```

### 2. Chrome Setup

Der API-Server startet Chrome automatisch mit Remote-Debugging:

- **Debug-Port:** `9222`
- **User-Data:** `C:\temp\chrome-debug`
- **Modus:** Sichtbarer Browser (nicht headless)

---

## 🏃 Server starten

### Entwicklungsmodus (mit Hot-Reload)

```powershell
# Terminal 1: Dev-Server
bun run dev:watch
```

Der Server läuft auf: **http://localhost:87**

### Produktionsmodus

```powershell
# 1. Kompilieren
bun run build

# 2. Starten
bun start
```

---

## 🧪 API testen

### Health Check

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:87/health"
```

### Login-Status prüfen

```powershell
$body = @{email="user@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:87/auth/check-login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Mit cURL

```bash
# Health Check
curl http://localhost:87/health

# Login-Status
curl -X POST http://localhost:87/auth/check-login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

---

## 📁 Projektstruktur

```
kleinanzeigen-api/
├── src/
│   ├── server/        # Fastify Server & API Endpoints
│   ├── services/      # Business Logic
│   ├── controllers/   # Request Handler
│   └── workers/       # Background Tasks
├── shared/            # Gemeinsame Utilities
├── web/               # Web-Frontend (optional)
├── data/              # Cookie-Speicher
│   └── cookies/       # cookies-{email}.json Dateien
├── dist/              # Kompilierter TypeScript Code
└── scripts/           # Hilfs-Skripte
```

---

## 🔥 Bun vs npm Vergleich

| Aktion | npm | Bun | Ersparnis |
|--------|-----|-----|-----------|
| `install` | ~11s | ~7s | **36% schneller** |
| `start` | ~2s | ~0.5s | **75% schneller** |
| TypeScript | Braucht ts-node | Native Support | ✅ |

### Warum Bun?

- 🚀 **Schneller** - Bis zu 25x schneller als npm
- 📦 **All-in-One** - Package Manager + Runtime + Bundler
- 📝 **TypeScript** - Native Unterstützung ohne Extra-Tools
- 💾 **Weniger Speicher** - Effizientere Abhängigkeitsverwaltung

---

## ❓ Häufige Probleme

### Chrome startet nicht

```powershell
# Chrome-Prozesse beenden
taskkill /f /im chrome.exe

# Temp-Ordner löschen
Remove-Item -Recurse -Force C:\temp\chrome-debug

# Server neu starten
bun start
```

### Port 87 belegt

```powershell
# Prozess auf Port 87 finden
netstat -ano | findstr :87

# Prozess beenden (PID ersetzen)
taskkill /pid <PID> /f
```

### Bun nicht gefunden

```powershell
# PATH neu laden
$env:Path = "C:\Users\$env:USERNAME\.bun\bin;$env:Path"

# Oder Terminal neu starten
```

---

## 🔗 Wichtige Links

- **API Dokumentation:** [README.md](./README.md)
- **Projektplan:** [Blueprint.md](./Blueprint.md)
- **Todo-Liste:** [TODO.md](./TODO.md)
- **Bun Docs:** [bun.sh/docs](https://bun.sh/docs)

---

## 📞 Support

Bei Problemen:
1. Prüfe die [Troubleshooting](#-häufige-probleme) Sektion
2. Lies die vollständige [README.md](./README.md)
3. Kontaktiere das Entwicklerteam

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 09.12.2025  
**Package Manager:** Bun 1.3.4 (empfohlen) / npm
