-- Add role column to profiles
alter table public.profiles add column if not exists role text default 'user';

-- Update the handle_new_user function to include role (default 'user' or first user as 'admin')
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;
  
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    case when is_first_user then 'admin' else 'user' end
  );
  
  insert into public.settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;
