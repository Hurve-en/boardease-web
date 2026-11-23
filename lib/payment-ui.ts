// Change this if your payments page lives at a different route.
export const PAYMENTS_PATH = "/payments";

export type Bill = {
    billId: string;
    tenantName: string;
    roomNumber: string | null;
    billingMonth: string;
    totalAmount: string;
    outstandingBalance: string;
    dueDate: string;
    status: "paid" | "partial" | "unpaid";
};

export type Receipt = {
    submissionId: string;
    status: string;
    amount: string;
    referenceNumber: string | null;
    receiptUrl: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    tenantFirstName: string | null;
    tenantLastName: string | null;
};

export function manilaToday(){
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
    }).format(new Date());
}

export function currentMonth(){
    return manilaToday().slice(0, 7);
}

// Accepts "YYYY-MM" from the URL, otherwise falls back to the current month.
export function resolveMonth(value?: string){
    return value && /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

export const money = (value: string | number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
        Number(value) || 0,
    );

export const monthLabel = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));

// e.g. "05 Oct 2026, 2:35 PM" in Manila time.
export const dateTime = (value: string | null | undefined) => {
    if(!value) return "—";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    }).format(date);
};

// Bill status colors (paid / partial / unpaid).
export const statusClass = (status: string) =>
    status === "paid"
        ? "bg-[#e4eedf] text-[#3d6b3a]"
        : status === "partial"
            ? "bg-[#f9eeda] text-[#8a5a12]"
            : "bg-[#f7e4dd] text-[#9b3a2e]";

// Submission status colors (pending / approved / rejected).
export const submissionStatusClass = (status: string) =>
    status === "approved"
        ? "bg-[#e4eedf] text-[#3d6b3a]"
        : status === "pending"
            ? "bg-[#f9eeda] text-[#8a5a12]"
            : "bg-[#f7e4dd] text-[#9b3a2e]";