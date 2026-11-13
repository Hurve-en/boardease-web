CREATE OR REPLACE FUNCTION public.sync_room_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.rooms
        SET status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM public.tenant_room_assignment
                WHERE room_id = OLD.room_id
                  AND status = 'active'
            )
            THEN 'occupied'::public.room_status
            ELSE 'unoccupied'::public.room_status
        END
        WHERE room_id = OLD.room_id;

        RETURN OLD;
    END IF;

    UPDATE public.rooms
    SET status = CASE
        WHEN EXISTS (
            SELECT 1
            FROM public.tenant_room_assignment
            WHERE room_id = NEW.room_id
              AND status = 'active'
        )
        THEN 'occupied'::public.room_status
        ELSE 'unoccupied'::public.room_status
    END
    WHERE room_id = NEW.room_id;

    IF TG_OP = 'UPDATE' AND OLD.room_id IS DISTINCT FROM NEW.room_id THEN
        UPDATE public.rooms
        SET status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM public.tenant_room_assignment
                WHERE room_id = OLD.room_id
                  AND status = 'active'
            )
            THEN 'occupied'::public.room_status
            ELSE 'unoccupied'::public.room_status
        END
        WHERE room_id = OLD.room_id;
    END IF;

    RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trigger_sync_room_status ON public.tenant_room_assignment;
--> statement-breakpoint
CREATE TRIGGER trigger_sync_room_status
AFTER INSERT OR UPDATE OR DELETE
ON public.tenant_room_assignment
FOR EACH ROW
EXECUTE FUNCTION public.sync_room_status();
