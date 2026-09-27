# Muse Property Group — Real Estate Booking Platform

A premium, production-ready real estate agent booking website with a secure
admin dashboard. Built with **React + TypeScript + Vite**, powered by
**Supabase** (database, backend & auth).

- **Public site** — hero, services, how-it-works, about, a real 4-step booking
  flow (service → date & time → details → confirmation), and footer.
- **Admin dashboard** (`#/admin`) — overview stats, appointments management,
  services CRUD, business hours editor, blocked dates, and business settings.
- **Real availability engine** — slots are generated from business hours,
  service duration, slot interval, booking notice, blocked dates, and existing
  appointments (overlap-safe).

---

## 1. Create the Supabase backend

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → new query → paste the entire contents of
   `supabase/schema.sql` → run it. This creates:
   - tables: `services`, `appointments`, `business_hours`, `blocked_dates`,
     `business_settings`, `admin_users`
   - Row Level Security policies (public can book without reading client data;
     admins get full access)
   - `booked_slots_for_date()` — a secure helper the public booking widget
     uses to check availability without reading appointments
   - seed data: weekly hours, starter real estate services, default settings
3. Create your admin login: **Authentication → Users → Add user** — create with
   email + password and confirm the email. Copy the user's UUID.
4. Back in SQL Editor, register that user as an admin:
   ```sql
   insert into public.admin_users (user_id) values ('<PASTE_USER_UUID>');
   ```
   Admin access is checked via `admin_users.user_id` against the authenticated
   user's id — never by email.

## 2. Connect the app

```bash
cp .env.local .env.local   # already in the project root
```

Edit `.env.local` and paste your values (Supabase project **Settings → API**):

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

- Website: `http://localhost:5173`
- Admin dashboard: `http://localhost:5173/#/admin` — sign in with the admin
  user you created in step 1.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import it in Vercel. Add the two environment variables
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the project settings.
3. Deploy — every push to `main` redeploys automatically.

---

## Project structure

```
supabase/schema.sql          # tables, RLS, policies, seed data
src/
  main.tsx / App.tsx          # hash routing: / → site, /admin → dashboard
  index.css / admin.css        # public + dashboard design systems
  lib/
    supabase.ts               # Supabase client (env vars, session persistence)
    types.ts                  # DB row types
    booking.ts                # availability engine + safe date/time helpers
    images.ts                 # central image library (easy to swap)
  components/                 # Navbar, Hero, Services, About, Booking, Footer
  pages/Home.tsx              # public site composition + data loading
  admin/
    AdminApp.tsx              # auth gate: getSession → getUser → admin_users check
    Login.tsx / Sidebar.tsx
    pages/                    # Overview, Appointments, Services,
                              # BusinessHours, BlockedDates, Settings
```

## Notes

- The public booking form uses **insert-only** for appointments and builds the
  success screen from local form data — no public read access to appointments.
- Availability respects: working hours, service duration, slot interval,
  booking notice hours, blocked dates, and overlapping appointments
  (`new_start < existing_end AND new_end > existing_start`). Cancelled
  appointments are ignored.
- The admin session is never cleared manually — it persists until the admin
  clicks **Sign out**. Token refreshes keep the dashboard alive.
- All imagery lives in `src/lib/images.ts` — swap any URL in one place.
