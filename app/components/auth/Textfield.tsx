type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export default function TextField({ label, id, ...props }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#2b2623]">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border border-[#e7e1d8] bg-white px-4 py-3 text-sm text-[#2b2623] outline-none focus:border-[#613d2b] focus:ring-2 focus:ring-[#613d2b]/20"
      />
    </div>
  );
}