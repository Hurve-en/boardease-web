"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle } from "lucide-react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function getLocation() {
  return `${window.location.search}${window.location.hash}`;
}

function messageFor(error: string | null) {
  if (error === "expired_or_used" || error === "otp_expired" || error === "invalid_or_expired_link") {
    return "That link expired or was already used. Request a new one below.";
  }
  if (error === "missing_token") {
    return "That link was not valid. Request a new one below.";
  }
  if (error === "missing_session") {
    return "The reset session could not be restored. Request a new link and open it in this browser.";
  }
  if (error === "verify_failed") {
    return "We couldn’t verify that link. Request a new one below.";
  }
  return null;
}

export default function ResetLinkErrorNotice({
  queryError,
  queryReason,
}: {
  queryError?: string;
  queryReason?: string;
}) {
  const location = useSyncExternalStore(
    subscribe,
    getLocation,
    () => {
      const params = new URLSearchParams();
      if (queryError) params.set("error", queryError);
      if (queryReason) params.set("reason", queryReason);
      return `?${params.toString()}`;
    },
  );
  const [search, hash = ""] = location.split("#", 2);
  const queryParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash);
  const hashMessage = messageFor(
    hashParams.get("error_code") ?? hashParams.get("error"),
  );
  const error = queryParams.get("error") ?? queryError ?? null;
  const queryMessage = messageFor(error);
  const reason = queryParams.get("reason") ?? queryReason;
  const message = hashMessage ?? queryMessage;

  if (!message) return null;
  return (
    <div role="alert" className="flex gap-2 rounded-2xl bg-(--be-danger-surface) px-4 py-3 text-sm text-(--be-danger-text)">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p>{message}</p>
        {process.env.NODE_ENV === "development" && error === "verify_failed" && reason && (
          <p className="mt-1 break-words">Reason: {reason}</p>
        )}
      </div>
    </div>
  );
}
