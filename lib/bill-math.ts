// Shared billing form and billing API para ang preview otal and save total kay dili mag lahi

function toCents(value: number): number {
	return Math.round(value * 100);
}

export function calculateTotal(
	rent: number,
	electricity: number,
	water: number,
): string {
	const cents = toCents(rent) + toCents(electricity) + toCents(water);
	return (cents / 100).toFixed(2);
}

export function billNumber(
	billingMonth: string,
	roomNumber: string | null,
): string {
	return `BE-${billingMonth.slice(2, 4)}${billingMonth.slice(5, 7)}-${roomNumber ?? "—"}`;
}
