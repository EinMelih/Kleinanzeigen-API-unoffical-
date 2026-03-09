# Live Test Findings

Stand: 2026-03-09

## 1. Externer Blocker: Kleinanzeigen IP-Bereich gesperrt

### Beobachtung

Beim Live-Test gegen Kleinanzeigen kam folgende Sperrmeldung:

> IP-Bereich voruebergehend gesperrt.
> In deinem IP-Bereich kam es vor Kurzem mehrfach zu unsicheren Versuchen, unsere Plattform zu verwenden.
> Dies kann auch durch andere Personen erfolgt sein. Daher wurde dieser IP-Bereich zur Vorbeugung von Betrug zeitweilig von der Nutzung von Kleinanzeigen ausgeschlossen.

Ref:

- `0.55611302.1773014900.d212960`
- IP: `2003:e7:4f17:fe72:ccfa:cd15:d1bf:79f7`

### Auswirkung

- Live-Login gegen Kleinanzeigen ist aktuell nicht verlaesslich testbar.
- Live-Suche und Message-Sending koennen von externer Plattformseite geblockt oder verfälscht werden.
- Fehler liegt aktuell nicht primaer im lokalen Fastify-Server, sondern an der Gegenseite bzw. am geblockten Netzbereich.

### Saubere Reaktion

- Automation fuer Live-Requests sofort drosseln oder pausieren
- Wiederholte Login-/Search-Versuche vermeiden
- Cooldown / Circuit Breaker aktivieren
- Spaeter erneut testen statt aggressiv weiter zu retrien
- Falls noetig offiziellen Support / offizielle Klaerung mit Kleinanzeigen pruefen

## 2. Auth-Flow inkonsistent gewesen

### Beobachtung

Der Test von `POST /auth/login` lieferte:

- `status=login_successful`
- gleichzeitig aber `loggedIn=false`

Das ist fachlich inkonsistent.

### Wahrscheinliche Ursache

- Der Login-Worker hat einen abgeschickten Login (`didSubmit`) als Erfolg behandelt, obwohl keine verifizierte Session erkannt wurde.

### Status

- Umgesetzt:
  - Login gilt nur noch dann als Erfolg, wenn `loggedIn=true`
  - reiner Form-Submit ohne verifizierte Session wird nicht mehr als Erfolg behandelt
- Live-Test:
  - `POST /auth/login` liefert unter aktiver Plattform-Sperre jetzt korrekt einen Fehler statt eines falschen Erfolgsstatus

## 3. `/auth/status/:email` war zu optimistisch

### Beobachtung

`GET /auth/status/:email` meldete den Account als eingeloggt, obwohl der Live-Check keine gueltige Session bestaetigt hat.

### Wahrscheinliche Ursache

- Der Endpoint hat bisher im Wesentlichen nur das Vorhandensein einer Cookie-Datei bewertet.

### Risiko

- Dashboard / UI kann einen falschen Login-Zustand anzeigen
- Folgeaktionen koennen auf einer nicht vorhandenen Session aufsetzen

### Status

- Umgesetzt:
  - Status basiert nicht mehr nur auf der Existenz der Cookie-Datei
  - Session-Validierung wird strenger bewertet

## 4. Cookie-Datei vorhanden, aber keine echte Session

### Beobachtung

Es wurde eine Datei erzeugt:

- `data/cookies/cookies-thomas322q_gmail_com.json`

Die Datei enthaelt Cookies, aber der Live-Check ergab keine bestaetigte Login-Session.

### Interpretation

- Es wurden vermutlich nur allgemeine oder Anti-Bot-/Seiten-Cookies gespeichert
- Eine authentifizierte Benutzer-Session wurde nicht sicher hergestellt

## 5. `auth/check-login` und `cookies/details` zeigen unterschiedliche Ebenen

### Beobachtung

- `POST /auth/check-login` meldete: nicht eingeloggt
- `GET /cookies/details/:email` meldete: Cookie-Datei ist formal gueltig / nicht abgelaufen

### Wichtig

Das ist kein Widerspruch auf derselben Ebene:

- `cookies/details` prueft Cookie-Gueltigkeit / Ablauf
- `auth/check-login` prueft die reale Session gegen Kleinanzeigen

### Konsequenz

- Unabgelaufene Cookies bedeuten nicht automatisch, dass der User wirklich eingeloggt ist

## 6. Live-Tests sind derzeit durch Plattform-Block limitiert

### Betroffene Bereiche

- Login
- Search mit echter Gegenseite
- Message-Senden
- Session-Validierung

### Nicht betroffen

- lokaler Fastify-Server
- Frontend
- interne Sniper-Analyse (`/sniper/analyze`, `/sniper/test` dry-run)
- Schema-/Architektur-Arbeit

## 7. Offene Konfigurationspunkte

- `TELEGRAM_CHAT_ID` fehlt noch
- `OPENAI_API_KEY` fehlt noch
- OAuth Email-Verifikation ist noch nicht eingerichtet
- Persistenz ist noch lokal und nicht in Supabase aktiv

## 8. Platform Guard / Cooldown jetzt aktiv

### Umgesetzt

- Block-Seite von Kleinanzeigen wird jetzt explizit erkannt
- Ref-Code und IP werden aus der Block-Seite extrahiert und lokal gespeichert
- weitere Live-Requests werden waehrend des Cooldowns frueh abgebrochen
- der Sperrstatus ist ueber `GET /app/overview` sichtbar

### Live verifiziert

- erkannter Ref-Code: `0.55611302.1773015592.d23fa10`
- erkannte IP: `2003:e7:4f17:fe72:ccfa:cd15:d1bf:79f7`
- persistierter Zustand: `data/platform-guard.json`
- `POST /search` bricht sofort mit Block-Fehler ab
- `POST /message/send` bricht sofort mit `PLATFORM_BLOCKED` ab
- `POST /auth/login` bricht mit konsistenter Fehlermeldung ab

## 9. Empfohlene nächste Schritte

1. Live-Automation gegen Kleinanzeigen vorerst pausieren, solange der IP-Bereich blockiert ist.
2. Einen lokalen Testmodus staerker ausbauen:
   - Dry-Run fuer Sniper
   - simuliertes Message-Sending
   - gespeicherte HTML-/JSON-Fixtures fuer Listings
3. Platform Guard noch zusaetzlich in Health-/Worker-Metriken aufnehmen.
4. Erst nach Ende der Sperre erneut echte Login-/Search-/Send-Tests ausfuehren.

## 10. Wichtig fuer die weitere Entwicklung

Die aktuell sichtbare Hauptursache fuer fehlgeschlagene Live-Tests ist nicht "Backend kaputt", sondern:

- externer Plattform-Block
- dazu noch einige inkonsistente interne Statusmeldungen im Auth-Bereich

Diese beiden Dinge muessen getrennt betrachtet werden.
