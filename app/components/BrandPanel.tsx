import { NotebookPen } from "lucide-react";
import Logo from "./auth/logo";
import ImagePlaceholder from "./auth/ImagePlaceholder";

export default function BrandPanel() {
  return (
    <aside className="hidden flex-col justify-between bg-[#3b271f] p-12 md:flex">
      <div className="space-y-10">
        <Logo />

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#d9c6b4]">
            Maple House · Tenant Workspace
          </p>
          <h1 className="text-5xl font-semibold leading-tight text-white">
            Your home. Your bills. <br /> All in one place.
          </h1>
          <p className="max-w-md text-[#d9c6b4]">
            Your monthly bills and recorded payments — together in one clear,
            organized place.
          </p>
        </div>

        <ImagePlaceholder />
      </div>

      <div className="flex items-center gap-3 text-sm text-[#d9c6b4]">
        <NotebookPen size={18} />
        Every bill accounted for. Every payment recorded.
      </div>
    </aside>
  );
}