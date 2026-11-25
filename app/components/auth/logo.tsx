import { Home } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--be-brand-light)">
        <Home size={18} className="text-(--be-brand-deep)" />
      </div>
      <span className="text-lg font-semibold text-white">BoardEase</span>
    </div>
  );
}