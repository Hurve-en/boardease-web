"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputClass } from "./authStyles";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  id: string;
  label: string;
};

export default function PasswordField({ id, label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input id={id} type={visible ? "text" : "password"} placeholder={label} {...props} className={`${authInputClass} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-(--be-text-muted) transition hover:bg-white hover:text-(--be-text-primary)"
      >
        {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}
