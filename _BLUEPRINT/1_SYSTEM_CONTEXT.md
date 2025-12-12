# 🏗️ System Context - Kleinanzeigen API (Unofficial)

> Letzte Aktualisierung: 12.12.2024

## 📌 Projekt-Übersicht

Eine inoffizielle API für Kleinanzeigen.de, die Web-Scraping nutzt um Suchanfragen, Artikel-Details und Authentifizierung zu ermöglichen.

## 🛠️ Tech Stack

| Bereich         | Technologie | Version |
| --------------- | ----------- | ------- |
| Runtime         | Bun         | Latest  |
| Framework       | Fastify     | ^5.x    |
| Scraping        | Puppeteer   | ^23.x   |
| Language        | TypeScript  | ^5.x    |
| Package Manager | Bun         | Latest  |

## 📐 Architektur-Entscheidungen

### Backend-Struktur

- **Routes** (`*.routes.ts`): Nur Fastify Route-Definitionen
- **Controllers** (`*.controller.ts`): Request/Response Handling
- **Services** (`*.service.ts`): Business Logik, Scraping
- **Types** (`*.types.ts`): TypeScript Interfaces

### Scraping-Strategie

- Puppeteer im Debug-Mode (Port 9222) für Cookie-Persistenz
- Headless-Browser für produktives Scraping
- Rate-Limiting Awareness eingebaut

## ⚠️ Globale Regeln

1. **300-Zeilen-Limit** pro Datei - keine Ausnahmen
2. **Kein `any`** - immer typisieren
3. **Early Returns** - Guard Clauses nutzen
4. **Error Handling** - try/catch bei async, nie Fehler schlucken

## 📦 Haupt-Dependencies

```json
{
  "fastify": "Server Framework",
  "puppeteer": "Web Scraping",
  "dotenv": "Environment Variables"
}
```

## 🔗 Externe Systeme

- **Kleinanzeigen.de**: Ziel-Website für Scraping
- **Email Providers**: Gmail/Outlook für Login-Verifizierung (OAuth2)
