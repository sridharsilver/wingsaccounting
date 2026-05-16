-- 1. Add email column to profiles
alter table public.profiles add column if not exists email text;

-- 2. Update existing profiles with their emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- 3. Update the handle_new_user function to include email
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;
  
  insert into public.profiles (id, full_name, avatar_url, email, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    case when is_first_user then 'admin' else 'user' end
  );
  
  insert into public.settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;
