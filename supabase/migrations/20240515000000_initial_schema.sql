-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- CUSTOMERS table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  gstin text,
  phone text,
  email text,
  billing_address text,
  shipping_address text,
  state text,
  state_code text, -- 2-digit GST state code
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.customers enable row level security;

create policy "Users can manage own customers" on public.customers
  for all using (auth.uid() = user_id);

-- PRODUCTS table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  hsn_code text,
  gst_rate decimal default 18,
  unit text default 'Pcs',
  price decimal not null default 0,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.products enable row level security;

create policy "Users can manage own products" on public.products
  for all using (auth.uid() = user_id);

-- SETTINGS table
create table public.settings (
  user_id uuid references auth.users on delete cascade not null primary key,
  company_name text,
  gstin text,
  logo_url text,
  address text,
  state text,
  state_code text,
  bank_details jsonb default '{"bank_name": "", "account_no": "", "ifsc": "", "branch": ""}'::jsonb,
  invoice_prefix text default 'INV-',
  next_invoice_number int default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.settings enable row level security;

create policy "Users can manage own settings" on public.settings
  for all using (auth.uid() = user_id);

-- INVOICES table
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_number text not null,
  date date not null default current_date,
  due_date date,
  customer_id uuid references public.customers(id) on delete set null,
  place_of_supply text,
  gst_type text check (gst_type in ('CGST_SGST', 'IGST')),
  subtotal decimal default 0,
  total_tax decimal default 0,
  total_amount decimal default 0,
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'partial', 'overdue')),
  notes text,
  terms text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.invoices enable row level security;

create policy "Users can manage own invoices" on public.invoices
  for all using (auth.uid() = user_id);

-- INVOICE_ITEMS table
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  description text, -- product name or custom description
  hsn_code text,
  qty decimal default 1,
  rate decimal default 0,
  gst_rate decimal default 18,
  amount decimal default 0
);

alter table public.invoice_items enable row level security;

create policy "Users can manage own invoice items" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices
      where id = invoice_id and user_id = auth.uid()
    )
  );

-- QUOTATIONS table
create table public.quotations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  quotation_number text not null,
  date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  status text default 'draft' check (status in ('draft', 'sent', 'approved', 'declined', 'converted')),
  total_amount decimal default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quotations enable row level security;

create policy "Users can manage own quotations" on public.quotations
  for all using (auth.uid() = user_id);

-- QUOTATION_ITEMS table
create table public.quotation_items (
  id uuid default uuid_generate_v4() primary key,
  quotation_id uuid references public.quotations(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  description text,
  qty decimal default 1,
  rate decimal default 0,
  gst_rate decimal default 18,
  amount decimal default 0
);

alter table public.quotation_items enable row level security;

create policy "Users can manage own quotation items" on public.quotation_items
  for all using (
    exists (
      select 1 from public.quotations
      where id = quotation_id and user_id = auth.uid()
    )
  );

-- PAYMENTS table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount decimal not null,
  payment_date date not null default current_date,
  payment_method text, -- Cash, Bank Transfer, UPI, Cheque
  reference_no text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.payments enable row level security;

create policy "Users can manage own payments" on public.payments
  for all using (auth.uid() = user_id);

-- Trigger for profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  insert into public.settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
