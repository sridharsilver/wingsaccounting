-- WINGS ACCOUNTING DATABASE SCHEMA
-- Run this in your Supabase SQL Editor

-- 1. PROFILES (for user information)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. SETTINGS (Business Details)
create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text,
  gstin text,
  address text,
  state text default 'Tamil Nadu',
  state_code text default '33',
  bank_details jsonb default '{"bank_name": "", "account_no": "", "ifsc": "", "branch": ""}'::jsonb,
  invoice_prefix text default 'INV-',
  next_invoice_number integer default 1,
  terms text default '1. Goods once sold will not be taken back. 2. Interest @ 18% will be charged if not paid within due date.',
  logo_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. CUSTOMERS
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  gstin text,
  phone text,
  email text,
  billing_address text,
  shipping_address text,
  state text,
  state_code text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. PRODUCTS
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  hsn_code text,
  gst_rate numeric default 18,
  price numeric default 0,
  unit text default 'PCS',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. INVOICES
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  invoice_number text not null,
  date date not null,
  due_date date,
  gst_type text check (gst_type in ('CGST_SGST', 'IGST')),
  place_of_supply text,
  subtotal numeric default 0,
  total_tax numeric default 0,
  total_amount numeric default 0,
  notes text,
  terms text,
  status text default 'Sent',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. INVOICE ITEMS
create table if not exists invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text not null,
  hsn_code text,
  qty numeric default 1,
  rate numeric default 0,
  gst_rate numeric default 18,
  amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. ENABLE ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- 8. CREATE POLICIES (Users can only see/edit their own data)
create policy "Users can manage their own profile" on profiles for all using (auth.uid() = id);
create policy "Users can manage their own settings" on settings for all using (auth.uid() = user_id);
create policy "Users can manage their own customers" on customers for all using (auth.uid() = user_id);
create policy "Users can manage their own products" on products for all using (auth.uid() = user_id);
create policy "Users can manage their own invoices" on invoices for all using (auth.uid() = user_id);
create policy "Users can manage their own invoice items" on invoice_items for all using (
  exists (select 1 from invoices where invoices.id = invoice_items.invoice_id and invoices.user_id = auth.uid())
);

-- 9. HELPER FOR INITIAL SETTINGS
-- This trigger creates a default settings row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  insert into public.settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
