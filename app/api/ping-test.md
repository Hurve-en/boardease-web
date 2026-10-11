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
