# Next.js Dance Studio App (MVP)

## How to run

1. Copy `.env.example` to `.env.local` and set ADMIN_PASSWORD.
2. Install deps: `npm install`
3. Run dev: `npm run dev`

This is a minimal prototype using a file `data/db.json` as storage.

Features added in v2:
- Participant can cancel their registration
- Admin can edit and delete groups
- Groups are date-bound and hidden if their start time (UTC+5) has already passed for today
