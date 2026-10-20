import { ImageIcon } from "lucide-react";

export default function ImagePlaceholder() {
  return (
    <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-[#5a4034] text-[#d9c6b4]">
      <ImageIcon size={32} />
      <span className="text-sm">Image placeholder</span>
    </div>
  );
}