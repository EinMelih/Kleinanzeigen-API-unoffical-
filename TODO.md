# 🚀 Kleinanzeigen API - TODO & Roadmap

## 🎯 **Aktuelle Prioritäten (Phase 1)**

- [x] Chrome-Service mit Remote Debugging
- [x] Login-Worker mit Puppeteer
- [x] Fastify API Server
- [x] Cookie-Management
- [x] TypeScript Migration
- [ ] **Web-Interface für Login-Daten**
- [ ] **Datenbank-Integration**

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
