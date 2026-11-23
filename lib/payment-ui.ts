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

export const statusClass = (status: string) =>
    status === "paid"
        ? "bg-[#e4eedf] text-[#3d6b3a]"
        : status === "partial"
            ? "bg-[#f9eeda] text-[#8a5a12]"
            : "bg-[#f7e4dd] text-[#9b3a2e]";