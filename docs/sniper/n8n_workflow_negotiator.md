# 💬 n8n Workflow B: Der Negotiator

> Dieser Workflow verhandelt automatisch mit Verkäufern basierend auf AI-Antworten.

---

## Workflow-Übersicht

```
[Webhook] → [DB Load] → [IF Active?] → [Wait Random] → [AI Chat] → [Switch] → [DB Update] → [Send Message]
```

---

## Node 1: Webhook Trigger

**Type:** Webhook  
**Method:** POST  
**Path:** `/webhook/chat/reply`

**Input JSON:**
```json
{
  "item_id": "uuid-hier",
  "seller_message": "Das ist mir zu wenig, 300€ ist mein letztes Angebot"
}
```

---

## Node 2: Supabase - Item laden

**Type:** Supabase  
**Operation:** Select Rows  
**Table:** `items`  
**Filters:** `id` equals `{{ $json.item_id }}`

---

## Node 3: IF - Auto Reply Active?

**Type:** IF  
**Condition:** `{{ $json.auto_reply_active }} equals true`

**False Branch:** → Respond "Bot inactive, manual required"

---

## Node 4: Wait - Humanizing

**Type:** Wait  
**Wait Value:** Expression  

**Expression für zufällige Wartezeit:**
```javascript
{{ Math.floor(Math.random() * (600 - 120 + 1) + 120) }}
```
**Unit:** Seconds (120-600 Sek. = 2-10 Min.)

---

## Node 5: Code - Chat History vorbereiten

**Type:** Code

```javascript
const item = $('Supabase - Item laden').first().json;
const newMessage = $('Webhook Trigger').first().json.seller_message;

// Bisherigen Chat-Verlauf laden
let chatHistory = item.chat_history || [];

// Neue Verkäufer-Nachricht hinzufügen
chatHistory.push({
  role: 'seller',
  message: newMessage,
  timestamp: new Date().toISOString()
});

return {
  item,
  chatHistory,
  newMessage
};
```

---

## Node 6: OpenAI - Negotiator Chat

**Type:** OpenAI  
**Resource:** Chat  
**Model:** `gpt-4o`

**System Prompt:**
```
Du bist ein Reseller. Verhandle höflich aber bestimmt.

CONTEXT:
- Item: {{ $json.item.title }}
- Mein Limit: {{ $json.item.max_sniping_price }}€
- Verlauf: {{ JSON.stringify($json.chatHistory) }}
- Neue Nachricht: {{ $json.newMessage }}

REGELN:
- "Du"-Form, kurz, mobil-optimiert (max 3 Sätze).
- Wenn Preis OK oder unter Limit -> Nach PayPal fragen, Deal abschließen.
- Wenn Preis zu hoch -> Gegenangebot machen (unter Limit bleiben).
- Wenn VB und Preis unklar -> Direktes Angebot machen.
- Wenn Verkäufer aggressiv oder seltsam -> escalate_to_human = true.
- Wenn Deal abgeschlossen -> stop_bot = true, status = "AGREED".
- Wenn Verkäufer ablehnt endgültig -> stop_bot = true, status = "FAILED".

JSON FORMAT:
{
  "analysis": { 
    "status": "NEGOTIATING" | "AGREED" | "FAILED",
    "seller_price": Number (falls genannt),
    "recommended_offer": Number
  },
  "action_required": { 
    "stop_bot": Boolean, 
    "escalate_to_human": Boolean,
    "reason": "String"
  },
  "generated_reply": { 
    "text_content": "Deutscher Antworttext" 
  }
}
```

---

## Node 7: Code - AI Response parsen

**Type:** Code

```javascript
const aiResponse = JSON.parse($input.first().json.message.content);
const item = $('Code - Chat History vorbereiten').first().json.item;
let chatHistory = $('Code - Chat History vorbereiten').first().json.chatHistory;

// Bot-Antwort zum Verlauf hinzufügen
chatHistory.push({
  role: 'bot',
  message: aiResponse.generated_reply.text_content,
  timestamp: new Date().toISOString()
});

return {
  aiResponse,
  item,
  chatHistory,
  newStatus: aiResponse.analysis.status,
  stopBot: aiResponse.action_required.stop_bot,
  escalate: aiResponse.action_required.escalate_to_human,
  replyText: aiResponse.generated_reply.text_content
};
```

---

## Node 8: Switch - Entscheidung

**Type:** Switch  
**Mode:** Rules

**Rules:**
1. `{{ $json.escalate }}` equals `true` → "Escalate" Branch
2. `{{ $json.stopBot }}` equals `true` → "Stop Bot" Branch
3. Default → "Continue" Branch

---

## Branch: Escalate

### Node 8a: Supabase - Deaktivieren

**Operation:** Update Row  
**Table:** `items`  
**ID:** `{{ $json.item.id }}`

| Column | Value |
|--------|-------|
| auto_reply_active | `false` |
| status | `MANUAL_REQ` |
| chat_history | `{{ JSON.stringify($json.chatHistory) }}` |

### Node 8b: Telegram/Discord - Alert

Sende Benachrichtigung an dich:
```
⚠️ ESKALATION ERFORDERLICH

Item: {{ $json.item.title }}
Grund: {{ $json.aiResponse.action_required.reason }}
Letzte Nachricht: {{ $json.aiResponse.generated_reply.text_content }}
```

---

## Branch: Stop Bot

### Node 9a: Supabase - Finalisieren

**Operation:** Update Row  
**Table:** `items`

| Column | Value |
|--------|-------|
| auto_reply_active | `false` |
| status | `{{ $json.newStatus === 'AGREED' ? 'BOUGHT' : 'REJECTED' }}` |
| chat_history | `{{ JSON.stringify($json.chatHistory) }}` |

---

## Branch: Continue (Normale Antwort)

### Node 10: Supabase - Update Chat

**Operation:** Update Row  
**Table:** `items`

| Column | Value |
|--------|-------|
| status | `NEGOTIATING` |
| chat_history | `{{ JSON.stringify($json.chatHistory) }}` |

### Node 11: HTTP Request - Nachricht senden

**Type:** HTTP Request  
**Method:** POST  
**URL:** `http://localhost:87/message/send`

**Body (JSON):**
```json
{
  "email": "deine-email@example.com",
  "articleId": "{{ $json.item.platform_item_id }}",
  "message": "{{ $json.replyText }}"
}
```

---

## Node 12: Respond to Webhook

**Response:**
```json
{
  "status": "{{ $json.newStatus }}",
  "reply_sent": true,
  "bot_active": "{{ !$json.stopBot && !$json.escalate }}",
  "reply_text": "{{ $json.replyText }}"
}
```

---

## Tipps

1. **Teste mit Mock-Daten:** Teste Webhook erst mit statischen Werten
2. **Prüfe Wait-Node:** Die Wartezeit verhindert Bans
3. **Backup:** Sichere Chat-History regelmäßig
