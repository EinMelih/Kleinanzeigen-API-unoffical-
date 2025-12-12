# RogueAnzeigen Blueprint - Erweiterte API Ideen

## 19) Klonen & Spiegeln von Anzeigen (Snapshotting, nur lokal)

**Ziel:** Eigene „Ghost-Vorlagen" bauen: Titel, Beschreibung, Kategorien/Unterkategorien, Attribute (Zustand, Größe, Farbe), Preis, Standort, Bilder-Slots, Versandoptionen.

### Funktionsumfang

- **Snapshot-Capture:** HTML/JSON-Extrakt → normalisieren → lokaler Datensatz + optionaler Medien-Snapshot (Hash, Größe, MIME)
- **Clone-Mapping:** Kategorie-/Attribut-Mapper (Quelle → interne Taxonomie)
- **Vorlagen-Generator:** „Make Template from Listing" → editierbare Ghost-Ad
- **Remix-Modus:** KI-gestützte Umschreibung des Texts (eigene Worte), Bildvarianten via lokale Tools/Prompts
- **Batch-Sampler:** mehrere Listings vergleichen → Best-of-Template (Titelbausteine, Attribut-Defaults)
- **Diff-History:** Original vs. eigene Fassung (Transparenz, Anti-Plagiat-Hinweise)

### Risiko-Kontrollen

- „Ethical Clone"-Flag: Bilder optional nicht speichern, nur Metadaten/Thumb-Hash
- Keine Massen-Reuploads, harte Limits/Quoten, Nur-Lokal Speicherort
- Copyright-Hinweis im UI, erzwinge Text-Umformulierung vor jeder externen Nutzung

## 20) Sonderfunktionen (abgespaced)

- **Mirrorboard:** Wandle eine fremde Anzeige in ein kontrollierbares HUD um (Preis-Schieberegler, Gegenangebot-Simulator, Kontakt-Timer, Follow-up-Buzzer)
- **Sniper-Timer:** Micro-Countdown auf neu entdeckte Raritäten mit Ein-Klick-Aktionen (Favorisieren, Template-Create, Nachricht-Entwurf)
- **Heatmap & Radar:** Zeit-/Ort-Heatmaps der Neuveröffentlichungen, Radar-Sweep Visual (SSE-Live-Pings)
- **Deal-Copilot:** Leitfaden-Overlays (Checkliste: Fragen, Fotos, Testkauf-Flow)
- **Seller-Trust-Lens:** Heuristiken + Signals (Profile-Alter, Antwortlatenz, Preis-Outlier, Text-Metriken) → Score mit Begründungen
- **Ghost-Inbox:** Lokale „gespiegelte" Thread-Ansicht (nur, wenn scrape-bar), sonst Copy-to-Clipboard Workflows

## 21) KI-Paket (Prompts, Scoring, Anti-Scam)

### Module

- **Rarity-Score:** Seltenheit/Knappheit (Stock-Signale, Keyword-Seltenheit, Trend-Peaks)
- **Flip-Score:** Wiederverkaufs-/Sparpotenzial (Preis vs. Marktmedian, Nachfrage-Trend)
- **Local-Demand-Score:** Umfeld-Nachfrage (Neu-/Tag-Rate, Antwortgeschwindigkeit vergangener ähnlicher Listings)
- **Anti-Scam-Guard:** Mustererkennung (Payment-Risiken, Bilder-Inkonsistenzen, Text-Anomalien)
- **Summarizer:** 3-Zeiler + Red-Flags + Deal-Checkliste
- **Message-Suggest:** Erstkontakt/Folgenachricht (Ton: höflich/kurz/präzise; Parameter: Budget, Abholung, Fragen)

### System-Prompt (konzeptionell)

- **Rolle:** „Undercover-Analyst für Second-Hand-Anzeigen" – strikt: keine Autoversände, nur Vorschläge
- **Objektive:** Rarity/Flip/Scam erklären, mit Belegen (Signals) + Confidence 0–1
- **Stil:** stichpunktartig, kurz, ohne Superlative, immer 3 Handlungsempfehlungen
- **Safeguards:** Wenn Daten dünn → „Unsicher / mehr Infos nötig" ausgeben; keine ToS-Umgehungen

## 22) Auto-Favorisieren & Regeln (Rule Engine+Scoring)

- **Trigger:** NEW_MATCH, PRICE_DROP, TRUST_SCORE↑, RARITY↑, SELLER_REPLIED
- **Bedingungen:** Preisband, Entfernung, Mindest-Rarity, Kategorien, Attributfilter
- **Aktionen:** Favorisieren (lokal), Markieren, Push, Template aus Anzeige erstellen, Nachricht-Entwurf (nur lokal)
- **Dämpfung:** Cooldowns, Tages-Budgets, Doppel-Kontakt-Sperre
- **Audit:** Jede Aktion mit Event+Begründung (Signals, Scores)

## 23) UI/Dashboard „Control Tower" (ohne Code)

### Layout: Zentrale Konsole mit 3 Zonen

- **Radar:** Live-Stream, Sweep-Animation, Filter-Dials
- **Ops-Deck:** Regeln, Queues, Limits-Monitor, Captcha-Thermometer
- **Deal-Stage:** aktuelle Hot-Leads, Sniper-Timer, Copilot-Pane

### Bedienung

- **Command-Palette:** ⌘K, Quick-Actions (Favorit, Template, Notiz, Snooze)
- **Badges:** Neu/Preisfall/Reserviert/Weg/Keine Antwort/Red-Flag – konsequent
- **Themes:** Dark-Neon, Glas-Karten, subtile Sonar-Pings (SSE-Keep-Alive)
- **Barrierearm:** Fokus-Zustände, Tastatur-Flows, Offline-Modus (lokaler Cache)

## 24) Compliance & Safeguards (Klonen/Automationen)

### Modes

- **SAFE (default):** keine Bilder speichern, Texte nur als Stichworte; Copy-to-Clipboard
- **EXPERT:** Bilder lokal + Hash; zwingende Text-Umschreibung vor externer Nutzung
- **LAB:** interne Experimente; niemals Sharing; harte Ratenlimits

### Review-Gates

- Vor externem Verwenden: Checkliste (Copyright, Quellenangabe, eigene Worte)
- **Legal-UI:** Jedes klonrelevante Panel mit AGB-Warnung, Quoten-Anzeige, „Nur lokal"-Icon

## 25) Events & Felder – Zusatz

### Neue Event-Typen

- CLONE_SNAPSHOT_CREATED (Quelle, Medien-Hashes, Attr-Map)
- TEMPLATE_CREATED_FROM_LISTING (Quelle, Quality-Score)
- RULE_AUTOFAVORITE (RuleId, Gründe/Signals)
- AI_SUMMARY_READY (Scores, RedFlags)
- SCAM_SUSPECTED (Signals, Confidence)
- SAFEGUARD_BLOCKED (Aktion, Grund, Cooldown)

### Felder-Erweiterungen

- **Listing:** media_hashes[], clone_policy, template_ref, trust_score
- **User×Listing:** ai_scores{rarity,flip,scam}, autofav_rule, copilot_notes

## 26) Monetarisierung & Tiers – Zusatz

- **Free:** Suche, Favoriten (manuell), Radar-Stream light
- **Pro (€10/Monat):** Regeln + Auto-Favorisieren, KI-Summary, Trust-Lens, Template-Generator (SAFE/EXPERT)
- **Elite:** zusätzliche Profile/Regeln, Batch-Sampler, Deal-Copilot-Module, Heatmap-Historie
- **Undercover-Branding:** generische Namen, neutrale Rechnungsposten

## 27) Prioritäten-Add-on (für nächste Iteration)

| Prio | Modul                 | MVP-Kern                | Risiko  | Notizen                 |
| ---- | --------------------- | ----------------------- | ------- | ----------------------- |
| A    | Auto-Favorisieren     | einfache Rule + Action  | niedrig | Nur lokal, auditierbar  |
| A    | AI-Summary            | Kurzfassung + Red-Flags | niedrig | Kein Autoversand        |
| B    | Clone-Snapshot (SAFE) | Metadaten + Thumb-Hash  | mittel  | Keine Bilder persistent |
| B    | Trust-Lens            | einfache Heuristiken    | mittel  | Transparent begründen   |
| C    | Template-Generator    | Ghost-Ad aus Listing    | mittel  | Umschreibungspflicht    |
| C    | Sniper-Timer          | UI-Timer + Aktionen     | niedrig | Nützlich fürs Radar     |

---

**Hinweis:** Später Temu Price Tracker - dafür separate Page geplant.
