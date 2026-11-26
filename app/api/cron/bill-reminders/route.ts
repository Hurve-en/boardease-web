import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }
  const rows = await db.execute(sql`
    with eligible as (
      select b.*, t.user_id, b.due_date - (now() at time zone 'Asia/Manila')::date as days
      from bills b join tenants t on b.tenant_id = t.tenant_id
      where b.outstanding_balance > 0 and t.archived_at is null and not exists (
        select 1 from payment_submissions p where p.bill_id = b.bill_id and p.status = 'pending'
      )
    ), reminders as (
      select *, case when days < 0 then 'overdue' when days = 0 then 'due_today' else 'due_soon' end as stage
      from eligible where days <= 0 or days between 1 and 3
    )
    insert into notifications (recipient_id, role, bill_id, kind, event_key, title, body)
    select user_id, 'tenant', bill_id, stage, concat(bill_id, '/', due_date, '/', stage),
      case stage when 'overdue' then 'Bill overdue' when 'due_today' then 'Bill due today' else 'Bill due soon' end,
      concat('₱', outstanding_balance, ' outstanding. Due date: ', due_date, '.')
    from reminders on conflict (recipient_id, event_key) do nothing returning id
  `);
  return Response.json({ created: rows.length });
}
