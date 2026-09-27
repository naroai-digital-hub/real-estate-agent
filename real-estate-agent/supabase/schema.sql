-- =====================================================================
-- Muse Property Group — Real Estate Booking Platform
-- Supabase schema: tables, RLS policies, helper functions, seed data
--
-- HOW TO APPLY
-- 1. Create a Supabase project at https://supabase.com
-- 2. Open the SQL Editor and run this entire file.
-- 3. Create an admin auth user: Authentication → Users → "Add user"
--    (create with email + password, confirm the email).
-- 4. Copy that user's UUID and insert it into admin_users:
--      insert into public.admin_users (user_id) values ('<USER_UUID>');
-- 5. Paste your project URL + publishable key into .env.local
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  duration_minutes integer not null default 30,
  price numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid not null references public.services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index appointments_date_idx on public.appointments (appointment_date);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique, -- 0 = Sunday … 6 = Saturday
  is_open boolean not null default true,
  start_time time not null default '09:00',
  end_time time not null default '18:00'
);

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Muse Property Group',
  business_email text not null default '',
  business_phone text not null default '',
  business_address text not null default '',
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 24,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Helper: is the current authenticated user an admin?
-- Security definer so the public cannot enumerate the table.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Helper: booked (non-cancelled) time ranges for one date.
-- Security definer so the public booking widget can check availability
-- without being able to read client details.
-- ---------------------------------------------------------------------

create or replace function public.booked_slots_for_date(p_date date)
returns table (start_time time, end_time time)
language sql
security definer
stable
as $$
  select a.start_time, a.end_time
  from public.appointments a
  where a.appointment_date = p_date
    and a.status <> 'cancelled'
  order by a.start_time;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.business_settings enable row level security;
alter table public.admin_users enable row level security;

-- services: public can read active services (needed for booking);
-- admins manage everything.
create policy "Public can read active services"
  on public.services for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage services"
  on public.services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- appointments: public can INSERT only (no public read of client data);
-- admins have full access.
create policy "Public can create appointments"
  on public.appointments for insert
  to anon, authenticated
  with check (true);

create policy "Admins can manage appointments"
  on public.appointments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- business_hours: public read (needed to compute availability);
-- admins manage.
create policy "Public can read business hours"
  on public.business_hours for select
  to anon, authenticated
  using (true);

create policy "Admins can manage business hours"
  on public.business_hours for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- blocked_dates: public read (needed to compute availability);
-- admins manage.
create policy "Public can read blocked dates"
  on public.blocked_dates for select
  to anon, authenticated
  using (true);

create policy "Admins can manage blocked dates"
  on public.blocked_dates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- business_settings: public read (name, contact info, slot rules);
-- admins manage.
create policy "Public can read business settings"
  on public.business_settings for select
  to anon, authenticated
  using (true);

create policy "Admins can manage business settings"
  on public.business_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users: an authenticated user can read their OWN row
-- (this is what the admin login check uses). Only admins can add rows.
create policy "Users can read their own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage admin users"
  on public.admin_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Allow public + authenticated users to call the availability helper.
grant execute on function public.booked_slots_for_date(date) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------

-- Business hours: Mon–Fri 9:00–18:00, Sat 10:00–15:00, Sun closed.
insert into public.business_hours (weekday, is_open, start_time, end_time) values
  (0, false, '09:00', '18:00'),
  (1, true,  '09:00', '18:00'),
  (2, true,  '09:00', '18:00'),
  (3, true,  '09:00', '18:00'),
  (4, true,  '09:00', '18:00'),
  (5, true,  '09:00', '18:00'),
  (6, true,  '10:00', '15:00')
on conflict (weekday) do nothing;

-- Default business settings row.
insert into public.business_settings
  (business_name, business_email, business_phone, business_address, slot_interval_minutes, booking_notice_hours)
values
  ('Muse Property Group', 'hello@museproperty.group', '+1 (555) 014-8890', '123 Market Street, Suite 400', 30, 24);

-- Starter real estate services (edit freely in the admin dashboard).
insert into public.services (name, description, duration_minutes, price, is_active) values
  (
    'Buyer Consultation',
    'A one-on-one session to define your goals, budget and timeline. We review current market conditions, financing readiness and build a clear property search strategy tailored to you.',
    60, 0, true
  ),
  (
    'Seller Consultation',
    'Walk through your home-selling strategy: pricing guidance, listing preparation, staging advice and a marketing plan designed to present your property at its best.',
    60, 0, true
  ),
  (
    'Property Viewing Appointment',
    'Tour a property in person with your agent. We walk the home together, discuss features and condition, and answer every question on the spot.',
    45, 25, true
  ),
  (
    'Home Valuation Consultation',
    'An in-depth review of your property''s estimated market value based on comparable sales, condition, upgrades and local market trends.',
    45, 49, true
  ),
  (
    'Investment Property Consultation',
    'Evaluate rental yield, growth potential and risk for investment properties. We analyse numbers together so you can decide with confidence.',
    60, 99, true
  ),
  (
    'Virtual Real Estate Consultation',
    'Meet online from anywhere. We review listings, documents or your buying/selling plan over video — the same expert guidance, fully remote.',
    30, 0, true
  );
