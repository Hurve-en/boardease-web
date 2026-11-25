import Image from "next/image";

export default function AuthBrand() {
  return (
    <div className="mb-8 flex items-center justify-center gap-2.5 min-[900px]:hidden">
      <Image
        src="/boardease-mark.png"
        alt=""
        width={493}
        height={469}
        style={{ width: 34, height: "auto" }}
        priority
      />
      <span className="text-lg font-bold tracking-tight text-(--be-text-primary)">BoardEase</span>
    </div>
  );
}
