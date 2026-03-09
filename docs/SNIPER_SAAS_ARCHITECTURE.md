# Sniper SaaS Architecture

## Zielbild

Die Plattform soll neue Kleinanzeigen-Listings moeglichst frueh erkennen, pro Nutzer gegen Suchkriterien pruefen, Preis/Fake-Risiko bewerten, eine Nachricht erzeugen und je nach Modus automatisch oder manuell versenden.

Der Schwerpunkt liegt zuerst auf einem stabilen Backend. Multi-User-SaaS, persistente Historie, AI-Integration und Notification-Orchestrierung muessen von Anfang an im Datenmodell beruecksichtigt werden.

## Kern-Module

### 1. Monitoring / Scraping

- Quelle: Kleinanzeigen Search / Artikel-Seiten
- Aufgabe: neue Listings erkennen, normalisieren, deduplizieren
- Output: `listings`, `sellers`, `listing_images`

### 2. Filter Engine

- Input: Listing + `search_criteria`
- Kriterien:
  - Kategorie
  - Preisband
  - VB oder Festpreis
  - Radius / Entfernung
  - Keywords
  - Zustand
  - Marke / Modell
- Output: Match / Reject + Begruendung

### 3. Price Intelligence

- Heuristik heute, AI spaeter
- Inputs:
  - Listing-Preis
  - Budget des Nutzers
  - Referenz-/Marktwert
  - VB-Signal
- Output:
  - `deal_score`
  - `budget_fit`
  - `below_market`
  - `suggested_offer_price`

### 4. Fake Detection

- Heuristik heute, AI spaeter
- Signale:
  - Profilalter
  - Bewertungen
  - Preis-Outlier
  - Beschreibungsmuster
  - Bildqualitaet / Bild-Wiederverwendung
- Output:
  - `fake_score`
  - `risk_level`
  - `reasons[]`
  - `flags[]`

### 5. Message Generation

- Heute: Template-/Heuristik-basiert
- Spaeter: AI-optimiert
- Muss koennen:
  - Seller-Name einbauen
  - Verfuegbarkeit fragen
  - optional Abholung anbieten
  - optional PayPal Kaeuferschutz nennen
  - optional Verhandlungsvorschlag einbauen

### 6. Action Engine

- Regeln:
  - `auto_send`
  - `manual_review`
  - `reject`
- Protokolliert:
  - `bot_actions`
  - `messages`
  - `notification_events`

### 7. Notifications

- Zielkanaele:
  - Telegram
  - Email
  - Webhook
- Payload:
  - Artikelname
  - Preis
  - Verkaeufer
  - Link
  - Zeitpunkt
  - gesendeter Nachrichtentext

## Aktueller Stand im Backend

### Bereits live

- Login / Cookie-Handling
- Search / Scraping
- Message-Senden
- Telegram Testversand
- Sniper Analyse:
  - `POST /sniper/analyze`
  - `POST /sniper/generate-message`
  - `POST /sniper/test`

### Noch nicht voll integriert

- Continuous worker fuer permanentes Polling
- Persistente Speicherung aller Listings in DB
- AI Provider fuer Preis/Fake/Text
- Vollstaendige Notification-Automation
- Multi-tenant Auth / Billing / SaaS Admin

## Empfohlene Event-Pipeline

1. Search Worker findet neues Listing
2. Listing wird normalisiert
3. Seller wird extrahiert / upsert
4. SearchCriteria des Nutzers werden evaluiert
5. PriceAnalysis + FakeAnalysis laufen
6. Decision Engine bestimmt:
   - reject
   - manual_review
   - auto_send
7. Message Draft wird erzeugt
8. Optional: Nachricht wird live gesendet
9. BotAction + Message + NotificationEvent werden gespeichert
10. Dashboard aktualisiert Statistiken

## Datenmodell

### Multi-Tenant Pflicht

Alle fachlichen Datensaetze muessen einem `user_id` zugeordnet sein:

- `app_users`
- `user_bots`
- `search_criteria`
- `sellers`
- `listings`
- `price_analysis`
- `fake_analysis`
- `generated_messages`
- `messages`
- `bot_actions`
- `notification_channels`
- `notification_events`
- `ai_jobs`

### Warum diese Trennung wichtig ist

- pro Nutzer getrennte Suchfilter
- pro Nutzer getrennte Budget-/Risiko-Grenzen
- pro Nutzer getrennte Bots / Sendemodi
- saubere SaaS-Isolation
- spaetere RLS in Supabase moeglich

## API-Schichten

### Scraper Layer

- `/search`
- `/scrape`
- spaeter: Worker / Queue / Scheduler

### Sniper Decision Layer

- `/sniper/analyze`
- `/sniper/generate-message`
- `/sniper/test`

### Delivery Layer

- `/message/send`
- spaeter: async queue + retry + cooldown + audit

### Config / Control Layer

- `/app/config`
- `/app/overview`
- `/app/telegram/test`

## Phasenplan

### Phase 1: Stable Backend Core

- Search Worker stabilisieren
- Listing Normalization vereinheitlichen
- Sniper Analyse live benutzen
- Dry-Run und Live-Send sauber trennen
- BotActions / Audit lokal oder DB-seitig speichern

### Phase 2: Persistence

- Supabase anbinden
- neue Listings dauerhaft speichern
- Seller-Historie aufbauen
- Preis- und Fake-Analysen versionieren

### Phase 3: SaaS Separation

- User Auth
- RLS
- pro Nutzer Bots / Limits / Channels
- Dashboard pro Tenant

### Phase 4: AI Layer

- AI fuer Listing-Bewertung
- AI fuer Price Reasoning
- AI fuer Scam-Unterstuetzung
- AI fuer Message Optimization

## Naechste sinnvolle Umsetzung

1. Search-Worker / Polling-Loop bauen, der periodisch neue Treffer je `search_criteria` zieht
2. lokale oder DB-basierte Speicherung fuer Listings/Sellers/BotActions einbauen
3. `/sniper/test` an echte Listing-Daten aus `/search` koppeln
4. Telegram Notifications nach erfolgreichem Message-Send automatisieren
