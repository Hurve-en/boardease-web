import { CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  type: "success" | "error";
  message: string;
};

export default function AuthMessage({ type, message }: Props) {
  const isSuccess = type === "success";

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        isSuccess ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}