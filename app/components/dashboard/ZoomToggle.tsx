"use client";

import { ZoomIn } from "lucide-react";
import { useState } from "react";
import { ZOOM_COOKIE } from "./zoom";

export default function ZoomToggle({ initialZoomed }: { initialZoomed: boolean }) {
  const [zoomed, setZoomed] = useState(initialZoomed);

  function toggle() {
    const next = !zoomed;
    setZoomed(next);
    document.querySelector(".app-shell")?.classList.toggle("is-zoomed", next);
    document.cookie = `${ZOOM_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      className="app-signout app-zoom-toggle"
      aria-pressed={zoomed}
      aria-label="Larger text"
      title="Larger text"
      onClick={toggle}
    >
      <ZoomIn size={14} aria-hidden="true" />
      <span>Larger text</span>
    </button>
  );
}
