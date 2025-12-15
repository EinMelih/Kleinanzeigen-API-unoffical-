# 🔍 Search & Scrape - Notizen

> **Endpoint-Dokumentation:** Siehe [docs/ENDPOINTS.md](../docs/ENDPOINTS.md)

---

## 📋 Implementierungs-Notizen

### Bilder-Scraping

**Problem (13.12.2024):** Nur 1 Bild pro Artikel wird gescraped.

**Ursache:** Kleinanzeigen nutzt Lazy-Loading. Bilder werden erst bei Scroll/Interaktion geladen.

**Lösung:**

1. Scroll-Aktion vor Scraping
2. 2 Sekunden Wartezeit
3. Priorisierung der Galerie-Thumbnails (meistens alle geladen)
4. Automatisches URL-Upgrade zu größerer Bildversion

### Ordnerstruktur

```
data/images/search/{Query}_{Ort}_{Radius}km_{Count}pc_{Datum}/
└── {Titel}_{ID}/
    ├── article-info.json
    └── image_0.jpg
```

---

## 🔜 TODO

- [ ] `GET /article/:id` - Einzelner Artikel per ID
- [ ] `detailLevel` Parameter für /search (preview/basic/full)
- [ ] Caching für häufige Suchen
- [ ] Rate-Limiting
