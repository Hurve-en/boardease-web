run ni sa cli pang get sa token sa account

ADMIN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"email":"admin@boardease.test","password":"qwerty"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

TENANT=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"email":"client@boardease.test","password":"qwerty"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo ${#ADMIN} ${#TENANT} verify if naay value if 0 recheck env.local

for r in admin-ping tenant-ping; do
echo "== $r"
  echo -n "no header:    "; curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/$r
echo -n "garbage: "; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer garbage" localhost:3000/api/$r
  echo -n "anon key:     "; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $KEY" localhost:3000/api/$r
echo -n "tenant token: "; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TENANT" localhost:3000/api/$r
echo -n "admin token: "; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN" localhost:3000/api/$r
done

results:
5 rows passed

== admin-ping
no header: 401
garbage: 401
anon key: 401
tenant token: 403
admin token: 200
== tenant-ping
no header: 401
garbage: 401
anon key: 401
tenant token: 200
admin token: 403

clean up
npx tsc --noEmit

BE-70 proof that the retrive of bill information works

HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
Date: Sun, 25 Oct 2026 04:07:07 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"rooms":{"total":0,"occupied":0,"unoccupied":0},"tenants":{"total":0,"active":0},"billing":{"month":"2026-10-01","totalBilled":"0","totalCollected":"0","totalOutstanding":"0","paidCount":0,"partialCount":0,"unpaidCount":0},"overdue":{"count":0,"amount":"0"},"recentPayments":[]}%

BE-71 proof that the retrive of tenant information works
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
Date: Sun, 25 Oct 2026 04:19:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"rooms":{"total":0,"occupied":0,"unoccupied":0},"tenants":{"total":0,"active":0},"billing":{"month":"2026-10-01","totalBilled":"0","totalCollected":"0","totalOutstanding":"0","paidCount":0,"partialCount":0,"unpaidCount":0},"overdue":{"count":0,"amount":"0"},"recentPayments":[]}%
