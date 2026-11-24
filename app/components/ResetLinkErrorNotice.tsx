"use client";

import { useSyncExternalStore } from "react";

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
    <div className="mt-4 text-sm text-red-700">
      <p role="alert">{message}</p>
      {process.env.NODE_ENV === "development" && error === "verify_failed" && reason && (
        <p className="mt-1 break-words">Reason: {reason}</p>
      )}
    </div>
  );
}
