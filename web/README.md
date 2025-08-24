# Kleinanzeigen API Web Interface

Eine moderne React-basierte Weboberfläche für die Kleinanzeigen API mit TypeScript, Tailwind CSS und shadcn/ui.

## 🚀 Features

- **Dashboard**: Übersicht über API-Status und Cookie-System
- **Authentication**: Login-Verwaltung und Status-Checks
- **Cookie Management**: Cookie-Testing, Cleanup und Auto-Refresh
- **Token Analysis**: JWT-Token-Analyse mit Zeitzonen
- **Health Monitoring**: Server-Status und Statistiken
- **Responsive Design**: Funktioniert auf allen Geräten
- **Dark/Light Mode**: Theme-Wechsel
- **Real-time Updates**: Live-Status-Updates

## 🛠️ Technologie-Stack

- **React 18** - Moderne UI-Bibliothek
- **TypeScript** - Typsichere Entwicklung
- **Tailwind CSS** - Utility-First CSS Framework
- **shadcn/ui** - Professionelle UI-Komponenten
- **Vite** - Schneller Build-Tool
- **React Router** - Client-seitiges Routing
- **Lucide Icons** - Moderne Icon-Bibliothek

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn

### Setup
```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build

# Build testen
npm run preview
```

## 🌐 Entwicklung

### Entwicklungsserver
```bash
npm run dev
```
Die App läuft dann auf: http://localhost:3000

### API-Proxy
Die Web-App ist so konfiguriert, dass alle `/api/*` Requests automatisch zu deiner Kleinanzeigen API auf Port 87 weitergeleitet werden.

### Build
```bash
npm run build
```
Erstellt einen optimierten Produktions-Build im `dist/` Verzeichnis.

## 📁 Projektstruktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
│   ├── ui/             # shadcn/ui Komponenten
│   ├── Layout.tsx      # Haupt-Layout mit Navigation
│   └── theme-toggle.tsx # Theme-Wechsel
├── pages/              # Verschiedene Seiten
│   ├── Dashboard.tsx   # Hauptseite
│   ├── Auth.tsx        # Login/Status
│   ├── Cookies.tsx     # Cookie-Management
│   ├── Tokens.tsx      # Token-Analyse
│   └── Health.tsx      # Server-Status
├── hooks/              # Custom React Hooks
├── lib/                # Hilfsfunktionen
├── App.tsx             # Haupt-App-Komponente
└── main.tsx            # Einstiegspunkt
```

## 🎨 Design-System

### Farben
- **Primary**: Blau (#3B82F6)
- **Secondary**: Hellgrau (#F1F5F9)
- **Destructive**: Rot (#EF4444)
- **Muted**: Gedämpfte Farben für Text

### Komponenten
Alle UI-Komponenten folgen dem gleichen Design-Prinzip:
- Konsistente Abstände
- Einheitliche Rundungen
- Schatten für Tiefe
- Hover-Effekte

## 🔧 Konfiguration

### Environment Variables
Erstelle eine `.env` Datei im `web/` Verzeichnis:

```env
VITE_API_URL=http://localhost:87
```

### Tailwind CSS
Die Tailwind-Konfiguration ist in `tailwind.config.js` definiert und erweitert das Standard-Design mit:

- CSS-Variablen für Farben
- Custom Animationen
- Responsive Breakpoints

### Vite
Die Vite-Konfiguration in `vite.config.ts` enthält:

- React-Plugin
- API-Proxy zu Port 87
- Path-Aliase (@/ → src/)

## 📱 Seiten

### Dashboard
- Übersicht über API-Status
- Cookie-Statistiken
- Quick Actions
- System-Informationen

### Authentication
- Login-Formular
- Status-Checks
- Erklärung der Login-Mechanismen

### Cookies
- Cookie-Testing
- Cleanup-Funktionen
- Auto-Refresh-Management

### Tokens
- JWT-Token-Analyse
- Zeitzonen-Umrechnung
- Ablaufzeiten-Anzeige

### Health
- Server-Status
- Detaillierte Statistiken
- System-Informationen

## 🚀 Deployment

### Statischer Host
```bash
npm run build
# dist/ Verzeichnis auf deinen Webserver hochladen
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔍 Debugging

### Browser Developer Tools
- **Console**: Logs und Fehler
- **Elements**: HTML-Struktur
- **Network**: API-Aufrufe
- **React DevTools**: React-Komponenten

### TypeScript
```bash
# TypeScript-Fehler finden
npm run lint

# Build-Fehler prüfen
npm run build
```

## 📚 Nützliche Links

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Mache deine Änderungen
4. Teste die Anwendung
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt ist Teil der Kleinanzeigen API und unterliegt der gleichen Lizenz.

## 🆘 Support

Bei Fragen oder Problemen:
1. Schaue in die Dokumentation
2. Überprüfe die Browser-Console
3. Teste die API-Endpoints direkt
4. Erstelle ein Issue im Repository
