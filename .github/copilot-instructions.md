# Copilot Instructions for Inventory Management System

## Project Architecture
- **Frontend:** Astro pages (`src/pages/`) use React components (`src/components/`) for UI. Pages are organized by domain: `dashboard`, `inventory`, `reports`, `tracking`, `transactions`.
- **API Layer:** Astro API routes in `src/pages/api/` handle backend logic. Each domain (inventory, reports, etc.) has its own subfolder and endpoint files (e.g., `generate-purchase-order.ts`).
- **Database:** Supabase (PostgreSQL) is used for all data storage, authentication, and real-time updates. Connection is managed via `src/utils/supabaseClient.ts`.
- **Styling:** Tailwind CSS with custom theme variables. Global styles in `src/styles/global.css`.
- **Static Assets:** Images, fonts, and scripts are in `public/`.

## Key Patterns & Conventions
- **TypeScript everywhere:** All API and logic files use TypeScript for type safety.
- **React for UI:** Components are function-based, often using hooks for state and effects. Modals, tables, and filters are common patterns (see `src/components/reports/logs.jsx`).
- **Astro for Routing:** Astro `.astro` files define page structure and route endpoints. API endpoints are `.ts` files under `src/pages/api/`.
- **Data Fetching:** Use Supabase client for all DB operations. API endpoints return JSON with a `success` property and relevant data.
- **PDF Generation:** Reports and details (e.g., purchase orders) use jsPDF and jspdf-autotable for PDF export (see `logs.jsx`).
- **Pagination & Sorting:** Tables support client-side pagination and sorting, with dropdowns for items per page and custom sort icons.
- **Error Handling:** API responses include `success: false` and error messages. UI shows skeleton loaders and error states.
- **Environment Variables:** Supabase credentials are set in `.env` as `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev` (Astro at `localhost:4321`)
- **Build for production:** `npm run build`
- **Preview build:** `npm run preview`
- **Database setup:** Use Supabase dashboard and SQL editor. See README for required tables.
- **API testing:** Use browser or tools like Postman to hit endpoints in `src/pages/api/`.

## Integration Points
- **Supabase:** All data, auth, and real-time events. See `src/utils/supabaseClient.ts` for setup.
- **jsPDF/jspdf-autotable:** Used for PDF export in reporting components.
- **Custom Events:** UI components dispatch and listen for custom events (e.g., filter, pagination) for cross-component communication.

## Examples
- **Purchase Order PDF:** See `src/components/reports/logs.jsx` for jsPDF usage and modal details.
- **API Endpoint:** See `src/pages/api/reports/generate-purchase-order.ts` for backend logic and response structure.
- **Table Pagination:** See `logs.jsx` for dropdown options and pagination logic.

## Project Structure References
- `src/components/` — UI components by domain
- `src/pages/api/` — API endpoints
- `src/utils/supabaseClient.ts` — Supabase connection
- `public/` — Static assets

---
For unclear patterns or missing documentation, ask the user for clarification or examples from their workflow.
