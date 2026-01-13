# Supabase Database Setup

## Problem: "Database error saving new user"

Wenn neue User sich nicht registrieren können, muss die Supabase Datenbank eingerichtet werden.

## Lösung: SQL Scripts ausführen

### Schritt 1: Supabase Dashboard öffnen

1. Gehe zu [supabase.com](https://supabase.com) und logge dich ein
2. Wähle dein Projekt
3. Klicke auf **SQL Editor** in der linken Sidebar

### Schritt 2: SQL Scripts der Reihe nach ausführen

Führe die Scripts im `/scripts` Ordner in dieser Reihenfolge aus:

#### 1. Tabellen erstellen
```bash
scripts/001_create_tables.sql
```
Erstellt alle Basis-Tabellen: profiles, user_settings, chats, messages, folders

#### 2. Signup Trigger installieren (WICHTIG!)
```bash
scripts/015_fix_signup_trigger.sql
```
Dieser Trigger erstellt automatisch Profile und Settings beim User-Signup.
**Das ist kritisch!** Ohne diesen Trigger schlägt die Registrierung fehl.

### Schritt 3: Verifizieren

Nach dem Ausführen solltest du haben:

✅ **Tabellen:**
- `profiles`
- `user_settings`
- `chats`
- `messages`
- `folders`
- `comparison_sessions`

✅ **Trigger:**
- `on_auth_user_created` → Erstellt automatisch Profile + Settings

✅ **RLS Policies:**
- User können nur ihre eigenen Daten sehen/ändern

### Trigger verifizieren

Prüfe ob der Trigger existiert:

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Sollte eine Zeile zurückgeben:
```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users
```

### Function verifizieren

```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

Sollte eine Zeile zurückgeben.

## Fallback: Code erstellt Profile automatisch

Falls der Trigger nicht läuft, erstellt die Sign-up Seite Profile und Settings manuell als Fallback. Aber der Trigger ist die bessere Lösung!

## Weitere Scripts (optional)

Im `/scripts` Ordner gibt es weitere Migrations für zusätzliche Features:

- `003_add_selected_model.sql` - Fügt selected_model hinzu
- `010_add_api_keys_column.sql` - API Keys Spalte
- `013_add_user_profile_fields.sql` - Extra Profile Felder
- etc.

Diese sind optional, aber empfohlen für alle Features.

## Troubleshooting

### "relation already exists"
Das ist OK - Script benutzt `IF NOT EXISTS`.

### "permission denied"
Du brauchst Admin-Rechte. Logge dich als Project Owner ein.

### Registrierung schlägt weiterhin fehl
1. Prüfe Browser Console für detaillierte Fehler
2. Prüfe Supabase Logs: **Logs → Postgres Logs**
3. Stelle sicher Email-Bestätigung DEAKTIVIERT ist:
   - **Authentication → Settings → Enable email confirmations** = OFF

### Email Confirmation Problem
Falls du Email-Bestätigung aktiviert hast:

1. **Testing:** Deaktiviere Email Confirmations in Supabase Settings
2. **Production:** Konfiguriere SMTP in Supabase für Email-Versand

---

Nach dem Setup können sich neue User registrieren! 🎉
