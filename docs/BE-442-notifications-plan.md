# BE-442 BoardEase notification plan

Proposed for review. The first release gives admins an inbox on web and mobile and tenants an inbox in the mobile app. Opening the same account on either client shows the same read state.

| Event | Recipient | Trigger and destination |
| --- | --- | --- |
| Bill issued | Tenant | After creation, open the bill to see the amount and due date. |
| Bill revised | Tenant | When the amount or due date changes, show what changed and open the bill. |
| Due soon | Tenant | Three calendar days before the due date, open the outstanding bill. |
| Due today | Tenant | On the due date, open the outstanding bill. |
| Overdue | Tenant | One reminder from the day after the due date, showing the remaining balance. |
| Payment proof submitted | Authorized admins | After the submission is saved, open the proof for review. A replacement submission also needs review. |
| Proof needs an update | Tenant | When the reviewer requests a correction, open the bill's proof screen with the review note. |
| Payment recorded | Tenant | After a manual payment or proof approval, show the credited amount and remaining balance. A zero balance gets a paid-in-full confirmation in the same alert. |

## Delivery rules

- Proposed schedule is 9 am Asia/Manila. A delayed run sends only the currently applicable reminder. Recalculate from the current due date after an edit. Skip reminders for a settled balance or archived tenant.
- Pause collection reminders while proof awaits review so a tenant is not prompted to pay again. After review, use the updated balance and next applicable reminder. Send at most one overdue notice per due date.
- An admin must already be authorized to review the target submission. A tenant receives only events about their own bills. Opening an alert rechecks access.

## Implementation order

1. Add recipient-specific inbox records in `db/schema.ts` and a Drizzle migration. Store the event type, source ID, display details, creation/read times and a unique event key per recipient. Use an authenticated list API with pagination, an unread count, and an operation to mark notifications read.
2. Integrate bill creation and edits in `lib/billing.ts`, proof submission and review in `app/api/payment-submissions/route.ts`, and payment recording in `lib/payment.ts`. Commit the inbox entry with the successful business change. Emit a single tenant confirmation when the payment transaction also approves proof.
3. Run a scheduled server job for reminders. Recheck balance, eligibility and pending proof at processing time. Deduplicate by recipient, bill, due date and reminder stage so repeated runs are safe.
4. Add a bell, unread count and inbox to `app/components/dashboard/DashboardShell.tsx` and the relevant admin and tenant screens in the Expo app. Route each item to the corresponding authorized screen. Refresh on focus and after actions.
5. If alerts must arrive while the app or browser is closed, add opt-in delivery after the inbox works. Register device or browser subscriptions per account, retry delivery separately and use generic lock-screen text. The shared inbox remains available when push is disabled.

## Verification

Run a bill through creation, revision, reminder, proof submission, correction, resubmission, approval and final settlement. Also exercise a manual partial payment. Check both clients, unread synchronization, recipient isolation, repeated jobs, failed transactions, edited due dates, archived tenants and pending proofs. Verify a payment fully settling a bill stops future reminders.

## Rollout

Apply migration 0018 with `npm run db:migrate` against the intended database before releasing either client. Bill changes, payment submissions, and payment reviews create inbox entries as they happen.

To enable automatic due-date reminders, set `CRON_SECRET` on the web server and configure a scheduler to call `GET /api/cron/bill-reminders` daily at 01:00 UTC (09:00 Manila) with the header `Authorization: Bearer <CRON_SECRET>`. The first run includes eligible outstanding older bills.
