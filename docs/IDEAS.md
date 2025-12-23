# 💡 Feature-Ideen

---

## 🔜 Geplante Features

### 1. Artikel-Wert-Berechnung (AI-Powered)

**Endpoint:** `POST /valuate` oder `GET /article/:id/value`

**Konzept:**

- eBay verkaufte Artikel durchsuchen (Sold Items)
- Beschreibung mit KI analysieren
- Zustand berücksichtigen (neu/gebraucht/defekt)

**Modi:**
| Modus | Beschreibung |
|-------|--------------|
| `quick` | Nur Titel-Vergleich, ohne Beschreibung |
| `detailed` | Mit Beschreibung + KI-Analyse |
| `defect` | Nur defekte Artikel vergleichen |
| `working` | Nur funktionierende Artikel |

### 2. Bulk Price Update (Batch Job)

**Workflow:**

1.  **Button:** "Alle Artikel bewerten" im Admin-Panel.
2.  **SQL Fetch:** Alle Items aus der DB holen.
3.  **AI Query Gen:** Für jedes Item generiert KI aus Titel/Beschreibung die optimale Such-Query (JSON).
4.  **Batch Processing:** Items werden nacheinander (oder parallel mit Limit) durch den `SearchScraper` gejagt.
5.  **Update:** Berechnete Durchschnittspreise werden per SQL-Update in die DB geschrieben.

**Vorteil:**

- Vollautomatisch für das ganze Inventar.
- Läuft im Hintergrund.

**Monetarisierung:**

- 💎 **Pro-Feature:** Exklusiv für zahlende Nutzer (Premium/Pro Plan).

**Request:**

```json
{
  "articleUrl": "https://www.kleinanzeigen.de/s-anzeige/...",
  "mode": "detailed",
  "condition": "used"
}
```

**Response:**

```json
{
  "estimatedValue": {
    "min": 650,
    "max": 750,
    "average": 700,
    "currency": "EUR"
  },
  "ebayComparisons": [{ "title": "...", "soldPrice": 680, "soldDate": "..." }],
  "confidence": 0.85,
  "factors": ["condition", "accessories", "age"]
}
```

---

### 2. Erweiterte Verkäufer-Infos in `/scrape`

**Aktuell:** Nur Name + Profil-URL

**Erweitern um:**

```json
"seller": {
  "name": "Khan Autoschlüsseldienst",
  "userId": "12345",
  "type": "commercial",
  "phone": "0123456789",
  "badges": ["TOP_SATISFACTION", "FRIENDLY", "RELIABLE"],
  "activeSince": "15.12.2022",
  "totalAds": 3,
  "profileUrl": "..."
}
```

**Badges:**

- `TOP_SATISFACTION` - Top Zufriedenheit
- `FRIENDLY` - Besonders freundlich
- `RELIABLE` - Besonders zuverlässig
- `VERIFIED` - Verifiziert

---

### 3. Verkäufer-Übersicht (optional, später)

**Endpoint:** `GET /seller/:userId/articles`

- Alle Anzeigen eines Verkäufers auf einmal
- Für Händler-Überwachung

---

### 4. Preis-Alarm / Watchlist

**Endpoint:** `POST /watch`

- Benachrichtigung wenn Artikel unter Preis X
- Neue Artikel mit bestimmten Keywords

---
