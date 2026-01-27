# 🤖 n8n Workflow A: Der Analyzer

> Dieser Workflow analysiert neue Artikel mit AI und entscheidet, ob gekauft/verhandelt werden soll.

---

## Workflow-Übersicht

```
[Webhook Trigger] → [Config Check] → [AI Vision] → [Business Logic] → [DB Insert] → [Response]
```

---

## Node 1: Webhook Trigger

**Type:** Webhook  
**Method:** POST  
**Path:** `/webhook/analyze`

**Input JSON:**
```json
{
  "image_url": "https://example.com/item.jpg",
  "description": "iPhone 12, leichte Kratzer, 128GB",
  "listing_price": 350
}
```

---

## Node 2: Supabase - Config laden

**Type:** Supabase  
**Operation:** Select Rows  
**Table:** `config`  
**Return All:** false (nur 1 Row)

---

## Node 3: IF - System Active?

**Type:** IF  
**Condition:** `{{ $json.system_active }} equals true`

**True Branch:** → Weiter zu Node 4  
**False Branch:** → Response "System deaktiviert"

---

## Node 4: OpenAI - Vision Analyse

**Type:** OpenAI  
**Resource:** Chat  
**Model:** `gpt-4o` oder `gpt-4-vision-preview`

**System Prompt:**
```
Du bist eine KI-Engine für E-Commerce Reselling.
INPUT: Bild + Beschreibung + Preis.
OUTPUT: Reines JSON.

SCHRITTE:
1. Analysiere Zustand & Mängel visuell.
2. Schätze Marktwert & berechne Marge (Abzüglich 15% Gebühren).
3. Suche Red Flags (Fake, Defekt).
4. Entscheide: BUY_NOW, NEGOTIATE oder SKIP.

JSON FORMAT:
{
  "item_analysis": { 
    "title": "String", 
    "condition_1_10": Number, 
    "defects": ["String"] 
  },
  "financials": { 
    "max_sniping_price": Number, 
    "projected_profit": Number 
  },
  "risk_assessment": { 
    "confidence_score": Number (0-100), 
    "is_scam": Boolean 
  },
  "decision_engine": { 
    "suggested_action": "BUY_NOW" | "NEGOTIATE" | "SKIP", 
    "reasoning": "String" 
  },
  "generated_messages": { 
    "seller_message": "Deutscher Text an Verkäufer" 
  }
}
```

**User Message:**
```
Bild-URL: {{ $json.image_url }}
Beschreibung: {{ $json.description }}
Angebotspreis: {{ $json.listing_price }}€
```

---

## Node 5: Code - Business Logic

**Type:** Code (JavaScript)

```javascript
const aiResult = JSON.parse($input.first().json.message.content);
const config = $('Supabase - Config laden').first().json;

const listingPrice = $('Webhook Trigger').first().json.listing_price;
const maxPrice = aiResult.financials.max_sniping_price;
const projectedProfit = aiResult.financials.projected_profit;
const minProfitMargin = config.min_profit_margin_percent;

// Berechne tatsächliche Marge
const actualMargin = (projectedProfit / listingPrice) * 100;

// Entscheidung
let finalAction = aiResult.decision_engine.suggested_action;
let autoReplyActive = true;

if (actualMargin < minProfitMargin) {
  finalAction = 'SKIP';
  autoReplyActive = false;
}

if (aiResult.risk_assessment.is_scam) {
  finalAction = 'SKIP';
  autoReplyActive = false;
}

if (aiResult.risk_assessment.confidence_score < 50) {
  finalAction = 'MANUAL_REQ';
  autoReplyActive = false;
}

return {
  ...aiResult,
  final_action: finalAction,
  auto_reply_active: autoReplyActive,
  actual_margin_percent: actualMargin.toFixed(2)
};
```

---

## Node 6: Supabase - Item einfügen

**Type:** Supabase  
**Operation:** Insert Row  
**Table:** `items`

**Columns:**
| Column | Value |
|--------|-------|
| platform_item_id | `{{ $('Webhook Trigger').first().json.image_url }}` |
| title | `{{ $json.item_analysis.title }}` |
| listing_price | `{{ $('Webhook Trigger').first().json.listing_price }}` |
| status | `{{ $json.final_action === 'SKIP' ? 'REJECTED' : 'NEW' }}` |
| confidence_score | `{{ $json.risk_assessment.confidence_score }}` |
| max_sniping_price | `{{ $json.financials.max_sniping_price }}` |
| projected_profit | `{{ $json.financials.projected_profit }}` |
| condition_score | `{{ $json.item_analysis.condition_1_10 }}` |
| defects | `{{ JSON.stringify($json.item_analysis.defects) }}` |
| is_scam | `{{ $json.risk_assessment.is_scam }}` |
| auto_reply_active | `{{ $json.auto_reply_active }}` |

---

## Node 7: Respond to Webhook

**Type:** Respond to Webhook

**Response:**
```json
{
  "status": "analyzed",
  "action": "{{ $json.final_action }}",
  "item_id": "{{ $('Supabase - Item einfügen').first().json.id }}",
  "max_price": {{ $json.financials.max_sniping_price }},
  "confidence": {{ $json.risk_assessment.confidence_score }},
  "seller_message": "{{ $json.generated_messages.seller_message }}"
}
```

---

## Import-Anleitung

1. In n8n: **Settings → Community Nodes**
2. Installiere: `n8n-nodes-supabase`
3. Erstelle neue Workflow
4. Füge Nodes in obiger Reihenfolge hinzu
5. Verbinde Credentials (OpenAI API Key, Supabase URL + Key)
