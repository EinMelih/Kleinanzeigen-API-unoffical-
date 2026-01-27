# 🎯 AI Reselling Sniper

> Automatisiertes System zur Artikel-Analyse, Preiskalkulation und Chat-Verhandlung auf Kleinanzeigen.

---

## 🏗️ Architektur

```
┌────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Kleinanzeigen│     │      n8n         │     │    Supabase     │
│   (Artikel)    │────▶│   Workflows      │────▶│   (Datenbank)   │
└────────────────┘     └──────────────────┘     └─────────────────┘
        │                      │                        │
        │              ┌───────┴───────┐               │
        │              │               │               │
        ▼              ▼               ▼               │
   ┌─────────┐   ┌──────────┐   ┌───────────┐          │
   │ Analyzer│   │Negotiator│   │  Control  │          │
   │   (A)   │   │   (B)    │   │  Center   │          │
   └─────────┘   └──────────┘   └───────────┘          │
        │              │                               │
        └──────────────┼───────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Kleinanzeigen   │
              │ API (Message)   │
              └─────────────────┘
```

---

## 📁 Dateien

| Datei | Beschreibung |
|-------|--------------|
| [supabase_schema.sql](./supabase_schema.sql) | Datenbank-Schema für Supabase |
| [n8n_workflow_analyzer.md](./n8n_workflow_analyzer.md) | Workflow A: Der Analyzer |
| [n8n_workflow_negotiator.md](./n8n_workflow_negotiator.md) | Workflow B: Der Negotiator |
| [n8n_workflow_control.md](./n8n_workflow_control.md) | Workflow C: Control Center |

---

## 🚀 Schnellstart

### 1. Supabase Setup

1. Erstelle Account auf [supabase.com](https://supabase.com)
2. Neues Projekt anlegen
3. SQL Editor öffnen
4. Inhalt von `supabase_schema.sql` einfügen und ausführen
5. API Keys kopieren (Settings → API)

### 2. n8n Setup

```bash
# Docker (empfohlen)
docker run -d --name n8n -p 5678:5678 n8nio/n8n

# Oder npm
npm install -g n8n
n8n start
```

Dann `http://localhost:5678` öffnen.

### 3. Kleinanzeigen API starten

```bash
cd Kleinanzeigen-API-unoffical-
bun install
bun run build
bun start
```

API läuft auf `http://localhost:87`

### 4. Workflows importieren

1. In n8n: Workflow A (Analyzer) erstellen nach Anleitung
2. Workflow B (Negotiator) erstellen
3. Workflow C (Control Center) erstellen
4. Credentials verbinden (OpenAI, Supabase)

---

## 📡 API Endpoints

### Kleinanzeigen API

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/message/send` | POST | Nachricht an Verkäufer senden |
| `/message/health` | GET | Service Health Check |
| `/search` | POST | Artikel suchen |

### n8n Webhooks

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/webhook/analyze` | POST | Artikel analysieren |
| `/webhook/chat/reply` | POST | Verkäufer-Antwort verarbeiten |
| `/webhook/status` | GET | System-Status |
| `/webhook/config` | POST | Config ändern |
| `/webhook/emergency-stop` | POST | Not-Aus |

---

## ⚠️ Wichtig

- **Rate Limiting:** Nicht zu schnell anfragen (Humanizing Wait-Nodes nutzen)
- **Login:** Stelle sicher, dass die Cookies gültig sind
- **Backup:** Sichere Supabase regelmäßig
- **Test:** Teste alle Workflows zuerst mit Mock-Daten
