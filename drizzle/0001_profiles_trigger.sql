create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;
--> statement-breakpoint
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();