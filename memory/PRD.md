# Micro Multimedia Grup — Landing Page PRD

## Original Problem Statement
Build a modern, high-converting, conversion-focused service landing page for a CCTV installation vendor (Indonesian). Dark theme palette: #1A1A1A base, #0F4C81 brand, #FF6B35 CTA. No login/register. Navigation only: Home, Layanan & Tarif, Panduan Survey, Portofolio, Kontak.

## User Choices
- WhatsApp business number: **6282136019744**
- Save form leads to MongoDB + redirect WhatsApp
- File uploads saved on backend (/app/backend/uploads)
- Stock images from Unsplash
- 4 placeholder testimonials

## Architecture
- **Backend**: FastAPI + Motor + MongoDB
  - `POST /api/leads` (multipart): saves SurveyLead with optional files
  - `GET /api/leads`: list (descending)
  - `GET /api/uploads/{lead_id}/{filename}`: static serve of uploads
  - `POST/GET /api/status`: existing health checks
- **Frontend**: React + Tailwind + Shadcn + Framer Motion + Sonner toasts
  - Single-page composition in `/src/pages/LandingPage.jsx`
  - Section components in `/src/components/site/*`
  - Shadcn `Select` for dropdowns; HTML `input[type=file]` for uploads
  - Form submits to `${REACT_APP_BACKEND_URL}/api/leads` then opens `wa.me` in new tab

## User Personas
1. **Pemilik Rumah** — wants neat, low-cost CCTV without project headaches.
2. **Pemilik Ruko / Retail** — needs reliable monitoring & remote access.
3. **Manajer Operasional Korporat / Gudang** — large multi-point install, needs documented BoQ.

## Implemented Features (Dec 2025)
- Hero (dual CTA, animated stats, hero image)
- Twin Pillars service comparison cards
- Before/After craftsmanship section
- Logistics terms (local free vs long-distance Rp250k/titik min 8)
- Two-stage Survey Method (free virtual vs Rp500k on-site deposit with BoQ Blueprint clause)
- Digital Survey Leads Form with Shadcn Select dropdowns, file upload, validation, backend persistence + WhatsApp redirect with prefilled message
- Portfolio grid with category filter (Semua / Residential / Retail/Ruko / Corporate/Gudang) — 6 placeholder cards
- Reviews grid — 4 testimonials
- Sticky glassmorphism Navbar + mobile menu
- Footer with WhatsApp CTA strip

## Backlog (P0 → P2)
- P1: Wire up dedicated `Services & Pricing` deep page (currently anchor scroll)
- P1: BoQ Blueprint PDF download teaser preview
- P2: SEO meta tags + OG image
- P2: Multilanguage toggle (ID/EN)
- P2: WhatsApp click-tracking analytics

## Test Credentials
N/A (no auth on this site).
