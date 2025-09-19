-- Create table to store Facebook ad account configurations
create table if not exists public.facebook_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id text not null,
  account_name text not null,
  access_token text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.facebook_accounts enable row level security;

-- Create RLS policies
create policy "facebook_accounts_select_own"
  on public.facebook_accounts for select
  using (auth.uid() = user_id);

create policy "facebook_accounts_insert_own"
  on public.facebook_accounts for insert
  with check (auth.uid() = user_id);

create policy "facebook_accounts_update_own"
  on public.facebook_accounts for update
  using (auth.uid() = user_id);

create policy "facebook_accounts_delete_own"
  on public.facebook_accounts for delete
  using (auth.uid() = user_id);
