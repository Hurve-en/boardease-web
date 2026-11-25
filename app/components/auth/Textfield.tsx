type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export default function TextField({ label, id, ...props }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-(--be-text-primary)">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border border-(--be-border-subtle) bg-white px-4 py-3 text-sm text-(--be-text-primary) outline-none focus:border-(--be-action-primary) focus:ring-2 focus:ring-(--be-action-primary)/20"
      />
    </div>
  );
}