# Current API

All paths are under `/todo`. Success bodies are flat JSON; errors are `{ "message": "..." }`.

| Method | Path | Behavior |
|---|---|---|
| POST | /register | Required names, valid email, username, password of at least 8 characters. Returns 201 and session payload. |
| POST | /login | Username/password; returns 200 and reuses a live session. |
| POST | /logout | Bearer authentication; deletes the current session. |
| GET | /lists | Bearer authentication; returns caller-owned lists sorted by name. Included to satisfy Feature 1's explicit protected-list scenario. |

Session payload: userId, username, email, fName, lName, role, token. No password hash is returned. Missing/invalid/expired authentication returns 401.
