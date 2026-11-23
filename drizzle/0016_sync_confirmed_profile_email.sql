CREATE FUNCTION public.sync_confirmed_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.sync_confirmed_profile_email() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER on_auth_email_changed
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email AND NEW.email IS NOT NULL)
EXECUTE FUNCTION public.sync_confirmed_profile_email();
