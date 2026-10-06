import {verifyAdmin} from "@/lib/dal";

export default async function DashboardPage() {
	const admin = await verifyAdmin();

	return (
		<main>
			<h1>test dashboard</h1>

			<p>testingss {admin.email}</p>
		</main>
	);
}
