# NoteMate – Keymint Licensing Demo

A minimal note‑taking web app demonstrating how premium features can be unlocked at runtime using the Keymint licensing API.

## Concept
Free tier: create, edit, delete notes.
Premium (unlocked with valid license):
- Export note (Markdown placeholder for PDF)
- Dark mode toggle

## Architecture
Frontend (Vite + React + Tailwind) → Backend (Express proxy) → Keymint API.
Backend holds KEYMINT_ACCESS_TOKEN and validates a user‑supplied license key via `/activate-key` (proxied by `/api/enter-license`). On success it stores an in‑memory `activeLicense` (tier PRO) and exposes entitlements.

## Run Locally
1. Edit `server/.env`:
```
KEYMINT_ACCESS_TOKEN=at_real_value
KEYMINT_PRODUCT_ID=prod_real_value
PORT=4000
```
2. Install deps (first time):
```
cd server && npm install
cd ../client && npm install
```
3. Start servers (in two terminals):
```
cd server && npm run dev
cd client && npm run dev
```
4. Open http://localhost:5173

## Demo Flow
1. App loads: tier is FREE, premium buttons disabled.
2. Enter a fake key → error toast.
3. Enter a real Keymint key → tier PRO, features unlock.
4. Create a note → Export (downloads markdown file) & toggle Dark Mode.

## Backend Routes
- `POST /api/enter-license` → activates supplied licenseKey against product.
- `GET /api/license-state` → returns `{ tier, features, hostId? }`.
- `GET /api/feature/exportPDF` / `GET /api/feature/darkMode` (authorization check only).

Removed legacy endpoints from earlier prototype (`/api/create-key`, etc.).

## Entitlements
Any valid activation -> tier PRO -> features: `exportPDF`, `darkMode`.
Invalid / not activated -> tier FREE.

## Notes / Limitations
- In‑memory only (restart resets license + notes).
- Export uses a simple Markdown blob instead of real PDF to keep minimal.
- For production: add persistence, real PDF (e.g. jsPDF), offline grace, better error UI.

## Security
Keep the Keymint access token server‑side only. Never embed in frontend.

## Future Enhancements
- Persist notes & license (SQLite)
- Real PDF generation
- License tier differentiation (PRO vs ENTERPRISE feature sets)
- Offline cached validation with revalidate interval
- CI + Docker demo container
