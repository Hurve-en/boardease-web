"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function MonthPicker({ month, label = "Billing month" }: { month: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="month-picker">
      <input
        type="month"
        aria-label={label}
        value={month}
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          const params = new URLSearchParams(searchParams.toString());
          params.set("month", value);
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
    </label>
  );
}
