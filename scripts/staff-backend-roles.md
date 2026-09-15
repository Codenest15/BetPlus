# Staff account (0541739307) — backend database

When `NEXT_PUBLIC_USE_BACKEND=true`, the app still recognizes your owner phone for admin fallback and manager UI, but the **API** should mark your user as staff once:

- `is_admin = true` — admin panel API calls
- `is_manager = true` — manager match/ticket API calls

Use the same password as in the app: **87654321**.

Adjust table/column names to match your FastAPI schema, for example:

```sql
UPDATE users
SET is_admin = true, is_manager = true
WHERE phone IN ('0541739307', '541739307', '+233541739307')
   OR email = 'me@gmail.com';
```

New registrations stay normal users until you grant **Make mgr** in Admin → Users.
