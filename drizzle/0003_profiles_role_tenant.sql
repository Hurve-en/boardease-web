update public.profiles set role = 'tenant' where role = 'client';
--> statement-breakpoint
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'tenant')
  on conflict (id) do nothing;
  return new;
end;
$$;