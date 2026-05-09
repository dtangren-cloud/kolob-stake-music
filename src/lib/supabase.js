import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUPABASE DATABASE SETUP
  Paste this into: Supabase → SQL Editor → New Query → Run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

create table if not exists music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  composer text,
  arranger text,
  voicing text,
  accompaniment text,
  category text,
  publisher text,
  publication_year int,
  total_copies int default 0,
  topic text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists checkouts (
  id uuid primary key default gen_random_uuid(),
  music_id uuid references music(id) on delete cascade,
  choir_ward text not null,
  director_name text not null,
  contact_email text,
  contact_phone text,
  copies_taken int not null,
  expected_return date,
  checked_out_at timestamptz default now(),
  returned_at timestamptz
);

create or replace view music_with_availability
with (security_invoker = true)
as
select
  m.*,
  coalesce(
    m.total_copies - sum(c.copies_taken) filter (where c.returned_at is null),
    m.total_copies
  )::int as available_copies,
  coalesce(
    sum(c.copies_taken) filter (where c.returned_at is null),
    0
  )::int as copies_out
from music m
left join checkouts c on c.music_id = m.id
group by m.id;

alter table music enable row level security;
alter table checkouts enable row level security;

create policy "public_all_music" on music for all using (true) with check (true);
create policy "public_all_checkouts" on checkouts for all using (true) with check (true);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
