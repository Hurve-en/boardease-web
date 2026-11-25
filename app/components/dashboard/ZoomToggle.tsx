"use client";

import { ZoomIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZOOM_COOKIE } from "./zoom";

export default function ZoomToggle({ initialZoomed }: { initialZoomed: boolean }) {
  const router = useRouter();
  const [zoomed, setZoomed] = useState(initialZoomed);

  function toggle() {
    const next = !zoomed;
    setZoomed(next);
    document.querySelector(".app-shell")?.classList.toggle("is-zoomed", next);
    document.cookie = `${ZOOM_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      className="app-signout app-zoom-toggle"
      aria-pressed={zoomed}
      title={zoomed ? "Use normal text size" : "Make text larger"}
      onClick={toggle}
    >
      <ZoomIn size={14} aria-hidden="true" />
      <span>Larger text</span>
    </button>
  );
}
