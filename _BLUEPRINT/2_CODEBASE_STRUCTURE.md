i# 📂 Codebase Structure - Kleinanzeigen API

> Letzte Aktualisierung: 12.12.2024

## 🗂️ Ordnerstruktur

```
Kleinanzeigen-API-unoffical/
│
├── _BLUEPRINT/                    # Lebende Dokumentation
│   ├── 1_SYSTEM_CONTEXT.md
│   ├── 2_CODEBASE_STRUCTURE.md
│   └── 3_PROGRESS_LOG.md
│
├── docs/                          # Statische Dokumentation
│   ├── API_REFERENCE.md
│   ├── GETTING_STARTED.md
│   └── IMPLEMENTATION_PLAN.md
│
├── src/
│   ├── server/
│   │   └── index.ts               # Server-Setup & Plugin-Registration
│   │
│   ├── routes/                    # Route-Definitionen
│   │   ├── auth.routes.ts         # /auth/* Endpoints
│   │   ├── cookies.routes.ts      # /cookies/* Endpoints
│   │   ├── oauth.routes.ts        # /oauth/* Endpoints
│   │   ├── search.routes.ts       # /search/* Endpoints
│   │   ├── tokens.routes.ts       # /tokens/* Endpoints
│   │   └── index.ts               # Route-Aggregator
│   │
│   ├── controllers/               # Request Handler
│   │   ├── auth.controller.ts
│   │   ├── cookies.controller.ts
│   │   ├── search.controller.ts
│   │   └── server.controller.ts
│   │
│   ├── services/                  # Business Logik
│   │   ├── auth-status.ts
│   │   ├── chrome.service.ts
│   │   ├── cookie-validator.service.ts
│   │   ├── cookie-refresh.service.ts
│   │   ├── email-verification.service.ts
│   │   ├── search-scraper.service.ts
│   │   ├── search-parser.service.ts     # NEU: HTML Parsing
│   │   └── token-analyzer.service.ts
│   │
│   ├── types/                     # TypeScript Interfaces
│   │   ├── auth.types.ts
│   │   ├── search.types.ts
│   │   ├── cookie.types.ts
│   │   └── index.ts
│   │
│   └── workers/
│       └── auth-login.ts
│
├── shared/                        # Shared Types zwischen Frontend/Backend
│   └── types/
│
├── web/                           # Web Frontend (falls vorhanden)
│
├── data/                          # Cookie-Speicher (gitignored)
│
└── Config Files
    ├── package.json
    ├── tsconfig.json
    └── .env
```

## 📄 Wichtige Core-Dateien

### Server Entry Point

- **`src/server/index.ts`**: Fastify Server Setup, registriert alle Routes

### Route-Dateien

| Datei               | Endpoints    | Beschreibung                       |
| ------------------- | ------------ | ---------------------------------- |
| `auth.routes.ts`    | `/auth/*`    | Login, Status, Email-Verifizierung |
| `cookies.routes.ts` | `/cookies/*` | Cookie Management, Refresh         |
| `oauth.routes.ts`   | `/oauth/*`   | Microsoft/Gmail OAuth Flow         |
| `search.routes.ts`  | `/search/*`  | Suche, Artikel-Scraping            |
| `tokens.routes.ts`  | `/tokens/*`  | JWT Token Analyse                  |

### Service-Dateien

| Datei                         | Verantwortung                 |
| ----------------------------- | ----------------------------- |
| `search-scraper.service.ts`   | Browser-Steuerung, Navigation |
| `search-parser.service.ts`    | HTML → Artikel-Objekte        |
| `cookie-validator.service.ts` | Cookie-Validierung            |
