import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const verifyAdmin = cache(async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return { userId: user.id, email: user.email };
});
