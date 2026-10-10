/* DB Hardening */
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_role_check"
  CHECK ("role" IN ('admin', 'tenant'));

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
  ON DELETE CASCADE;