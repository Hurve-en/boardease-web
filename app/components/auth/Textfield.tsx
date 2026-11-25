"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export default function TextField({ label, id, ...props }: TextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = props.type === "password";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-(--be-text-primary)">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          {...props}
          type={isPassword && passwordVisible ? "text" : props.type}
          className={`w-full rounded-lg border border-[#e7e1d8] bg-white py-3 pl-4 pr-12 text-sm text-[#2b2623] outline-none focus:border-[#613d2b] focus:ring-2 focus:ring-[#613d2b]/20${props.className ? ` ${props.className}` : ""}`}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={passwordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-md text-[#675c52] hover:bg-[#f7f3ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#613d2b]/40"
          >
            {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
