import { Home } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6d5c3]">
        <Home size={18} className="text-[#3b271f]" />
      </div>
      <span className="text-lg font-semibold text-white">BoardEase</span>
    </div>
  );
}