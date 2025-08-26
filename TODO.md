# 🚀 Kleinanzeigen API - TODO & Roadmap

## 🎯 **Aktuelle Prioritäten (Phase 1)**

- [x] Chrome-Service mit Remote Debugging
- [x] Login-Worker mit Puppeteer
- [x] Fastify API Server
- [x] Cookie-Management
- [x] TypeScript Migration
- [x] **Web-Interface für Login-Daten**
      web oberfläche skiziieren etc zeichnen die seiten alle und dann mit chatgpt bild genereieren und dann das an cursor grafikktablet nehmen dafür aus keller und danach datenbank tabellen machen und mit richtigen datenbefüllen und das login machen

        wenn login klappt und registrieren dann nochmal halt datenbank so perfekt machen das es getrennt ist alles was gescrapt wird nur auf diesen account zugewiesen und wenn ein konto multi konto hat also mehrere kleinanzeigen accounts auch das beachten und lernen wie die datenbank aufgebaut ist in so einem fall


        🎯 MVP-Funktionen für dein Kleinanzeigen-API Projekt

  Bereich MVP-Funktion
  Auth/User Registrierung & Login für unsere App-User (E-Mail + Passwort, Argon2-Hash, Session/JWT).
  Multi-Account Ein App-User kann mehrere Kleinanzeigen.de-Accounts speichern (E-Mail, Cookies, Status).
  Login-Flow Automatisierter Login via Puppeteer (mit Stealth), Cookies speichern & wiederverwenden.
  Cookie-Handling Cookies prüfen, refreshen wenn nötig, Auto-Login bei Ablauf.
  Anzeigen CRUD - Anzeigen erstellen

Anzeigen abrufen (eigene Ads)

Anzeigen bearbeiten

Anzeigen löschen |
| Scraping/Search | Suche nach Anzeigen (Keyword, Ort, Preisbereich) → Ergebnisse als JSON zurück. |
| Basic Stats | Views, Nachrichten, ggf. Favoriten pro Ad auslesen & speichern. |
| API-Server | REST-API (Fastify/Express): /auth/_, /ka/accounts, /ads/_, /search. |
| DB-Basis | Prisma-Schema mit: User, KaAccount, Ad, CookieJar, Session. |

🔒 Wichtige Erinnerung

Risiken: AGB-Verstoß ⇒ Account-Sperren/IP-Bans.

Nur Testen: kein Spamming, keine Massenaktionen.

Passwörter nie speichern → nur Hash (App-Login) & verschlüsselte Cookies (Kleinanzeigen-Accounts).

🚦 Roadmap danach

V2: Analytics-Graphen, Job-Queue, Rate-Limit-Probes.

V3: KI-Features (Seltenheits-Analyse, Auto-Nachrichten), Mobile App.

Monetarisierung: SaaS-Modell, Subscriptions.
👉 Dein MVP ist also: User + Multi-Account + Login/Cookies + CRUD für Ads + Suche + Stats – das reicht schon für ein funktionierendes Grundprodukt.

- [] **Datenbank-Integration**

## 🏗️ **Architektur-Überlegungen**

### **Phase 2: Web-Interface + Datenbank**

```
User Flow:
1. User öffnet Web-Interface
2. Loggt sich in die Website ein (eigener Account)
3. Kann seine eBay Kleinanzeigen Login-Daten eingeben
4. Daten werden in Datenbank gespeichert
5. API kann auf diese gespeicherten Daten zugreifen
```

### **Admin vs. User Features**

- **Admin (du)**: Erweiterte Features, alle User verwalten
- **Normal User**: Nur eigene Login-Daten verwalten

### **Datenbank-Schema (später)**

```sql
users:
  - id
  - email
  - password_hash
  - created_at

kleinanzeigen_accounts:
  - id
  - user_id (foreign key)
  - kleinanzeigen_email
  - kleinanzeigen_password (encrypted)
  - is_active
  - last_login
  - created_at
```

## 🔧 **Technische Details**

### **Ersetzung von ENV-Variablen**

- **Aktuell**: `KLEINANZEIGEN_EMAIL`, `KLEINANZEIGEN_PASSWORD` aus .env
- **Zukunft**: Dynamisch aus Datenbank pro User

### **Web-Interface Features**

- [ ] User Registration/Login
- [ ] Dashboard für eigene Kleinanzeigen-Accounts
- [ ] Formular für Login-Daten-Eingabe
- [ ] Admin-Panel für alle User

## 📋 **Nächste Schritte**

1. **Login-Fehler beheben** (aktuell)
2. **Web-Interface erstellen** (React/Vue.js)
3. **Datenbank einrichten** (PostgreSQL/MySQL)
4. **User-Management implementieren**
5. **Admin-Features entwickeln**

## 🎵 **"Musik erstmal das Login richtig machen"**

- [x] Chrome startet automatisch
- [x] WebSocket Endpoint wird geholt
- [x] Puppeteer verbindet sich
- [x] Login-Prozess läuft
- [x] Browser bleibt offen
- [ ] **Web-Interface für Login-Daten-Eingabe**
- [ ] **Datenbank statt ENV**

---

_Erstellt: $(Get-Date)_
_Status: Phase 1 abgeschlossen, Phase 2 geplant_
