import { CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  type: "success" | "error";
  message: string;
};

export default function AuthMessage({ type, message }: Props) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
        isSuccess
          ? "bg-(--be-success-surface) text-(--be-success-text)"
          : "bg-(--be-danger-surface) text-(--be-danger-text)"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
      {message}
    </div>
  );
}
