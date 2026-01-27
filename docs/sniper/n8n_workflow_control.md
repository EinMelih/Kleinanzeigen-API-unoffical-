# 🎛️ n8n Workflow C: Control Center

> Monitoring und Konfiguration des Sniper-Systems.

---

## Endpoint 1: GET /webhook/status

Gibt System-Status und Statistiken zurück.

### Nodes:

1. **Webhook Trigger** (GET `/webhook/status`)
2. **Supabase - Config laden**
3. **Supabase - Items zählen** (SQL Query)

```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'NEW') as new,
  COUNT(*) FILTER (WHERE status = 'NEGOTIATING') as negotiating,
  COUNT(*) FILTER (WHERE status = 'BOUGHT') as bought,
  COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
  COUNT(*) FILTER (WHERE status = 'MANUAL_REQ') as manual_required
FROM items
WHERE created_at > NOW() - INTERVAL '24 hours'
```

4. **Respond to Webhook**:
```json
{
  "system_active": "{{ $('Supabase - Config laden').first().json.system_active }}",
  "stats_24h": {
    "total": {{ $json.total }},
    "new": {{ $json.new }},
    "negotiating": {{ $json.negotiating }},
    "bought": {{ $json.bought }},
    "rejected": {{ $json.rejected }},
    "manual_required": {{ $json.manual_required }}
  },
  "config": {
    "min_profit_margin": {{ $('Supabase - Config laden').first().json.min_profit_margin_percent }},
    "max_price_limit": {{ $('Supabase - Config laden').first().json.max_price_limit }}
  },
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## Endpoint 2: POST /webhook/config

Aktualisiert Config-Einstellungen.

### Nodes:

1. **Webhook Trigger** (POST `/webhook/config`)

**Input:**
```json
{
  "min_profit_margin_percent": 40,
  "system_active": false,
  "max_price_limit": 300
}
```

2. **Supabase - Config updaten**

**Operation:** Update Row  
**Table:** `config`  
**ID:** 1

Nur Felder updaten, die im Request vorhanden sind.

3. **Respond to Webhook**:
```json
{
  "status": "updated",
  "changes": {{ JSON.stringify($('Webhook Trigger').first().json) }},
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## Endpoint 3: POST /webhook/emergency-stop

Not-Aus für alle aktiven Verhandlungen.

### Nodes:

1. **Webhook Trigger** (POST `/webhook/emergency-stop`)

2. **Supabase - System deaktivieren**

```sql
UPDATE config SET system_active = false WHERE id = 1;
```

3. **Supabase - Alle Items stoppen**

```sql
UPDATE items 
SET auto_reply_active = false 
WHERE status IN ('NEW', 'NEGOTIATING');
```

4. **Respond:**
```json
{
  "status": "emergency_stop_executed",
  "items_stopped": {{ $json.count }},
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## Monitoring Dashboard (Optional)

Für ein Dashboard kannst du:

1. **Supabase Dashboard** nutzen (kostenlos)
2. **Retool** anbinden
3. **n8n + HTML Response** für simplen Status
