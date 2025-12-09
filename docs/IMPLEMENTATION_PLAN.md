# 🎯 Kleinanzeigen API - Vollständiger Implementierungsplan

## 📋 Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    KLEINANZEIGEN API                        │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Login & Cookies (✅ FERTIG)                       │
│  Phase 2: Humanizing & Anti-Bot (⏳ IN ARBEIT)              │
│  Phase 3: Scraping-Endpunkte (⏳ GEPLANT)                   │
│  Phase 4: Account-Erstellung (⏳ GEPLANT)                   │
│  Phase 5: React Dashboard (⏳ GEPLANT)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ WICHTIG: Warum Proxies?

**Problem:** Wenn du mit deiner echten IP scrapst und Kleinanzeigen dich erkennt:
- IP wird gesperrt = Dein ganzer Haushalt kommt nicht mehr auf Kleinanzeigen
- Account wird gesperrt = Kann permanent sein

**Lösung:** Proxies = "Geliehene" Internet-Leitungen
- Kleinanzeigen sieht IP aus Frankfurt, nicht deine echte IP
- Wenn Proxy gesperrt wird -> Neuen nehmen, deine IP bleibt sicher

---

## 🍪 Cookie-Konzept: Der "VIP-Ausweis"

### Was ist ein Session-Cookie?

```
┌─────────────────────────────────────────────────────────────┐
│ SESSION-COOKIE = Digitaler Schlüssel                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Du loggst dich ein (Email + Passwort)                    │
│ 2. Server sagt: "OK, hier ist dein Cookie"                  │
│ 3. Bei jeder Anfrage schickst du den Cookie mit             │
│ 4. Server sagt: "Ah, das ist User XY, bereits eingeloggt"   │
└─────────────────────────────────────────────────────────────┘
```

### Kann man Cookies auf anderem Gerät nutzen?

**Theoretisch JA** - Cookie ist wie ein "Schlüssel"
**Praktisch:** Kleinanzeigen prüft zusätzlich:
- IP-Adresse (ändert sich → 2FA)
- Browser-Fingerprint (User-Agent, Plugins, etc.)
- Gerätewechsel-Erkennung

**Unsere Strategie:**
1. Login mit Proxy X → Cookies speichern
2. Alle zukünftigen Requests mit Proxy X + Cookies
3. = Kleinanzeigen denkt: "Gleicher Nutzer, gleiches Gerät"

---

## 🕵️ Humanizing: Wie ein Mensch wirken

### Warum erkennt Kleinanzeigen Bots?

| Bot-Verhalten | Menschliches Verhalten |
|---------------|------------------------|
| `page.click()` = Sofort, 0ms | Maus bewegt sich zum Button, ~300-500ms |
| Tippt 100 Zeichen in 0.1s | Tippt mit Pausen, ~150-300ms/Zeichen |
| Immer gleicher User-Agent | Verschiedene Browser/Geräte |
| 100 Requests/Minute | 2-5 Requests/Minute |
| Kein Scrollen | Scrollt beim Lesen |

### Humanizing-Techniken (bereits implementiert):

```typescript
// Bereits in auth-login.ts:
await humanMouseMove(page, selector);  // Maus bewegt sich "natürlich"
await humanType(page, selector, text); // Tippt mit zufälligen Pausen
await randomDelay();                   // 1-3 Sekunden Pause
```

### Was noch fehlt:

- [ ] Scroll-Simulation beim Scrapen
- [ ] Zufällige Mausbewegungen während Wartezeiten
- [ ] User-Agent Rotation
- [ ] Viewport-Größen variieren

---

## 🔓 Login vs. Kein Login (WICHTIG!)

### Was geht OHNE Login?

| Aktion | Login nötig? | Parallel möglich? |
|--------|--------------|-------------------|
| ✅ Artikel suchen | NEIN | JA, mehrere Tabs |
| ✅ Artikel-Details ansehen | NEIN | JA |
| ✅ Bilder laden | NEIN | JA |
| ✅ Nutzer-Profile ansehen | NEIN | JA |
| ✅ Kategorien browsen | NEIN | JA |

### Was braucht Login?

| Aktion | Login nötig? | Risiko |
|--------|--------------|--------|
| ❌ Anzeige erstellen | JA | Account-Ban möglich |
| ❌ Nachrichten lesen/senden | JA | Account-Ban möglich |
| ❌ Eigenes Profil bearbeiten | JA | Account-Ban möglich |
| ❌ Favoriten verwalten | JA | Account-Ban möglich |

### Die "Smart Scraping" Strategie:

```
┌─────────────────────────────────────────────────────────────┐
│ SCRAPING (Suche, Details, Profile) = OHNE LOGIN            │
├─────────────────────────────────────────────────────────────┤
│ ✅ Kein Account gefährdet                                   │
│ ✅ Mehrere parallele Requests möglich (mehrere Tabs)        │
│ ✅ 1 Proxy kann viele Suchen gleichzeitig machen            │
│ ✅ Wenn IP gesperrt → neuen Proxy, kein Schaden             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AKTIONEN (Inserieren, Nachrichten) = MIT LOGIN              │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Nur wenn nötig einloggen                                 │
│ ⚠️ Langsam und vorsichtig                                   │
│ ⚠️ 1 Account = 1 feste IP (Static Proxy)                    │
│ ⚠️ Cookies speichern, nicht neu einloggen                   │
└─────────────────────────────────────────────────────────────┘
```

### Parallel Scraping mit einem Proxy:

```typescript
// OHNE Login - Mehrere Suchen gleichzeitig mit 1 Proxy!
const proxy = "http://user:pass@iproyal.com:12321";

// Parallel suchen
const results = await Promise.all([
  searchAds("iPhone", proxy),       // Tab 1
  searchAds("PlayStation", proxy),  // Tab 2
  searchAds("Laptop", proxy),       // Tab 3
]);

// Alle 3 laufen gleichzeitig, gleicher Proxy = OK!
```

**Fazit:** Für reines Scraping brauchst du KEINEN Login = viel sicherer!

### 🤖 Auto-Modus (API entscheidet selbst):

```typescript
// Die API entscheidet AUTOMATISCH ob Login nötig ist!

function executeAction(action: string, params: any) {
  
  // Diese Aktionen brauchen KEINEN Login
  const noLoginRequired = [
    'search',           // Artikel suchen
    'getAdDetails',     // Artikel-Details
    'getProfile',       // Nutzer-Profile ansehen
    'getCategories',    // Kategorien laden
    'getImages',        // Bilder laden
  ];
  
  // Diese Aktionen brauchen Login
  const loginRequired = [
    'createAd',         // Anzeige erstellen
    'editAd',           // Anzeige bearbeiten
    'deleteAd',         // Anzeige löschen
    'sendMessage',      // Nachricht senden
    'getMyMessages',    // Eigene Nachrichten
    'getMyAds',         // Eigene Anzeigen
    'editProfile',      // Profil bearbeiten
  ];
  
  if (noLoginRequired.includes(action)) {
    // NUR Proxy, kein Account-Risiko!
    return scrapeWithProxy(params);
  } else {
    // Mit Login/Cookies
    return executeWithAuth(params);
  }
}
```

### Endpunkt-Übersicht:

| Endpunkt | Login? | Modus |
|----------|--------|-------|
| `GET /search` | ❌ | Nur Proxy |
| `GET /ad/:id` | ❌ | Nur Proxy |
| `GET /profile/:id` | ❌ | Nur Proxy |
| `GET /categories` | ❌ | Nur Proxy |
| `POST /ad/create` | ✅ | Mit Account |
| `GET /my/messages` | ✅ | Mit Account |
| `GET /my/ads` | ✅ | Mit Account |
| `POST /message/send` | ✅ | Mit Account |

---

## 🌐 Proxy-Strategie

### Empfohlener Anbieter: IPRoyal

| Feature | Wert |
|---------|------|
| Preis | ~$1.75-3.50/GB |
| Deutsche IPs | 1.4 Millionen verfügbar |
| Rotation | 1 Sekunde bis 24 Stunden einstellbar |
| Sticky IP | Bis zu 24h gleiche IP möglich |
| Traffic-Verfall | NIE - du zahlst nur was du brauchst |

### Zwei Proxy-Typen:

```
┌─────────────────────────────────────────────────────────────┐
│ STATIC PROXY (für Login/Account-Aktionen)                   │
├─────────────────────────────────────────────────────────────┤
│ - 1 feste IP pro Account                                    │
│ - Wichtig: Kleinanzeigen erwartet gleiche IP bei Login      │
│ - Preis: ~$1.50/Monat pro IP                                │
│                                                             │
│ Account melih@email.de → immer Proxy A (IP: 1.2.3.4)       │
│ Account fake1@temp.de  → immer Proxy B (IP: 5.6.7.8)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ROTATING PROXY (für Suche/Scraping)                         │
├─────────────────────────────────────────────────────────────┤
│ - Neue IP bei jeder Anfrage                                 │
│ - Verhindert Rate-Limiting beim Scrapen                     │
│ - Preis: ~$1.75/GB Traffic                                  │
│                                                             │
│ Suche "iPhone"  → IP: 1.1.1.1                               │
│ Suche "BMW"     → IP: 2.2.2.2                               │
│ Suche "Laptop"  → IP: 3.3.3.3                               │
└─────────────────────────────────────────────────────────────┘
```

### Zwei-Browser-Strategie:

```typescript
// Browser 1: Account-Aktionen (Static Proxy)
// Langlebige Chrome-Instanz mit fester IP
const accountBrowser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:9222/...'
});

// Browser 2: Scraping (Rotating Proxy)  
// Kurzlebig, neue Instanz pro Anfrage
const scraperBrowser = await puppeteer.launch({
  args: [`--proxy-server=${rotatingProxyUrl}`]
});
```

---

## 📊 Rate-Limiting & Captchas

### Wann sperrt Kleinanzeigen?

| Aktion | Limit (ca.) | Reaktion |
|--------|-------------|----------|
| Suchanfragen | >50/Stunde | IP-Block, Captcha |
| Seiten aufrufen | >100/Stunde | Soft-Block |
| Login-Versuche | >5/Stunde | Account-Lock |
| Account-Erstellung | >2/Tag/IP | IP-Ban |

### Wann kommen Captchas?

- ❌ Zu viele Anfragen in kurzer Zeit
- ❌ Login von neuer IP/neuem Gerät
- ❌ Verdächtiges Verhalten (zu schnell, zu viel)
- ❌ Account-Erstellung (IMMER)

### Captcha-Strategien:

1. **Vermeiden:** Langsam sein, Pausen machen, Cookies behalten
2. **Lösen:** Captcha-Solving-Services (2Captcha, Anti-Captcha)
3. **Umgehen:** Requests so aussehen lassen wie echter Browser

---

## 🗂️ Projektstruktur (Modular)

```
src/
├── api/                          # Fastify Endpoints
│   ├── auth-routes.ts            # /auth/login, /auth/check
│   ├── search-routes.ts          # /search
│   ├── ad-routes.ts              # /ad/:id, /ad/create
│   └── profile-routes.ts         # /profile/:id
│
├── core/                         # Basis-Infrastruktur
│   ├── proxy-manager.ts          # Proxy-Rotation & Health-Check
│   ├── browser-pool.ts           # Verwaltet Browser-Instanzen
│   └── session-store.ts          # Cookie-Speicherung
│
├── services/                     # Business-Logik
│   ├── auth/
│   │   ├── login.ts              # ✅ Vorhanden
│   │   └── cookie-validator.ts   # ✅ Vorhanden
│   │
│   ├── scraper/
│   │   ├── search-scraper.ts     # Suche scrapen
│   │   ├── detail-scraper.ts     # Anzeigen-Details
│   │   ├── profile-scraper.ts    # Nutzer-Profile
│   │   └── parsers/              # HTML → JSON Umwandlung
│   │       ├── ad-parser.ts
│   │       └── price-parser.ts
│   │
│   └── actions/
│       ├── post-ad.ts            # Anzeige erstellen
│       ├── send-message.ts       # Nachricht senden
│       └── edit-profile.ts       # Profil bearbeiten
│
├── utils/
│   ├── humanize.ts               # ✅ Mausbewegungen, Tippen
│   └── user-agents.ts            # User-Agent Rotation
│
└── tests/
    ├── unit/                     # Schnelle Logik-Tests
    │   └── parser.test.ts
    └── integration/              # Live-Tests (1x täglich)
        └── live-check.test.ts
```

---

## 🧪 Testing-Strategie

### Unit Tests (laufen immer, schnell)

```typescript
// tests/unit/parser.test.ts
import { describe, it, expect } from 'vitest';
import { cleanPrice } from '../src/services/scraper/parsers/price-parser';

describe('Preis Parser', () => {
  it('sollte "150 € VB" in 150 umwandeln', () => {
    expect(cleanPrice("150 € VB")).toBe(150);
  });
  
  it('sollte "Zu verschenken" als 0 behandeln', () => {
    expect(cleanPrice("Zu verschenken")).toBe(0);
  });
});
```

**Ausführen:** `npx vitest` (läuft im Watch-Mode)

### Integration Tests (1x täglich, mit echtem Proxy)

```typescript
// tests/integration/live-check.test.ts
describe.skipIf(!process.env.RUN_LIVE_TESTS)('Live Check', () => {
  
  it('sollte Suchergebnisse finden', async () => {
    const results = await searchAds('Fahrrad');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBeDefined();
  }, 30000);
  
  it('sollte Login-Page erkennen', async () => {
    const page = await openPage('/m-einloggen.html');
    const emailField = await page.$('#login-email');
    expect(emailField).toBeTruthy();
  });
});
```

**Ausführen:** GitHub Action jeden Morgen um 8:00 Uhr

---

## 📱 React Dashboard (Phase 5)

### Lern-Ziele:

1. **useState** - Daten speichern
2. **useEffect** - Daten laden
3. **fetch()** - API aufrufen
4. **map()** - Listen rendern

### Beispiel-Code:

```jsx
function Dashboard() {
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState("iPhone");
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    const res = await fetch(`http://localhost:87/search?q=${search}`);
    const data = await res.json();
    setAds(data.results);
    setLoading(false);
  };

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <button onClick={fetchAds}>
        {loading ? "Lade..." : "Suchen"}
      </button>
      
      {ads.map((ad) => (
        <div key={ad.id}>
          <h3>{ad.title}</h3>
          <p>{ad.price}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Phase 1: Login & Cookies (FERTIG)

| Feature | Status |
|---------|--------|
| Login mit Puppeteer | ✅ |
| Humanisierte Eingaben | ✅ |
| Cookie-Speicherung | ✅ |
| Cookie-Wiederverwendung | ✅ |
| 2FA-Erkennung | ✅ |
| Auto-Refresh | ✅ |

---

## 📋 Phase 2: Proxy & Humanizing (ALS NÄCHSTES)

### To-Do Liste:

- [ ] IPRoyal Account erstellen
- [ ] 1 Static Proxy kaufen (~$1.50)
- [ ] 1GB Rotating Proxy kaufen (~$3.50)
- [ ] `proxy-manager.ts` implementieren
- [ ] Proxy-Config in `.env` hinzufügen
- [ ] Chrome mit Proxy starten
- [ ] User-Agent Rotation einbauen
- [ ] Tests mit Proxy durchführen

### Proxy in .env:

```env
# Static Proxy (für Login)
STATIC_PROXY_HOST=1.2.3.4
STATIC_PROXY_PORT=8080
STATIC_PROXY_USER=username
STATIC_PROXY_PASS=password

# Rotating Proxy (für Scraping)
ROTATING_PROXY_HOST=gate.iproyal.com
ROTATING_PROXY_PORT=12321
ROTATING_PROXY_USER=username
ROTATING_PROXY_PASS=password_country-de
```

---

## 📋 Phase 3: Scraping-Endpunkte

### Geplante Endpunkte:

| Endpunkt | Parameter | Beschreibung |
|----------|-----------|--------------|
| `GET /search` | q, location, radius, min_price, max_price, category, page, limit | Suche mit Filtern |
| `GET /ad/:id` | fetch_images, fetch_seller | Anzeigen-Details |
| `GET /profile/:id` | fetch_ads, fetch_ratings | Nutzer-Profil |
| `GET /categories` | - | Alle Kategorien |
| `GET /my/ads` | - | Eigene Anzeigen (auth) |
| `GET /my/messages` | - | Eigene Nachrichten (auth) |

### Beispiel-Response:

```json
{
  "status": "success",
  "meta": {
    "query": "iPhone 13",
    "total_results": 42,
    "page": 1,
    "scraped_at": "2024-01-15T10:00:00Z"
  },
  "data": [
    {
      "id": "23482910",
      "title": "iPhone 13 - Neuwertig",
      "price": 450.00,
      "currency": "EUR",
      "location": "Berlin",
      "image_url": "https://...",
      "link": "/s-anzeige/..."
    }
  ]
}
```

---

## 📋 Phase 4: Account-Erstellung

### Benötigte Services:

| Service | Zweck | Preis |
|---------|-------|-------|
| **Temp-Email** (MailSlurp) | Email-Verifizierung | Kostenlos-$10/Mo |
| **SMS-Service** (5sim.net) | Telefon-Verifizierung | ~$0.30-0.50/SMS |
| **Captcha-Solver** (2Captcha) | Falls Captcha | ~$3/1000 Captchas |

### Workflow:

```
1. Temp-Email generieren
2. Registrierung starten
3. Email-Link automatisch klicken
4. SMS-Nummer kaufen
5. SMS-Code eingeben
6. ✅ Account fertig
```

---

## 💰 Kostenübersicht

| Service | Kosten |
|---------|--------|
| IPRoyal Static Proxy | ~$1.50/Monat |
| IPRoyal Rotating (1GB) | ~$3.50 einmalig |
| SMS für Account | ~$0.50/Account |
| Temp-Email | Kostenlos |
| **Start-Budget** | **~$5-10** |

---

## ⚠️ Goldene Regeln

1. **Cookies sind Gold** - Einmal einloggen, dann Cookies behalten!
2. **1 Proxy = 1 Account** - Niemals mischen!
3. **Langsam sein** - Lieber 2-5 Sekunden Pause als Captcha
4. **Original-Accounts schonen** - Nur eigenes Profil & Chats
5. **Fake-Accounts für Traffic** - Suchen, Scraping
6. **Täglich testen** - Selektoren können sich ändern

---

## 🚀 Nächste Schritte

1. [ ] IPRoyal Account erstellen & Proxy kaufen
2. [ ] `proxy-manager.ts` implementieren
3. [ ] Chrome-Start mit Proxy anpassen
4. [ ] Ersten Scraping-Endpunkt `/search` bauen
5. [ ] Unit-Tests aufsetzen (Vitest)
6. [ ] React-Projekt initialisieren

---

*Erstellt: 2025-12-09*
*Status: Phase 1 fertig, Phase 2 beginnt*
