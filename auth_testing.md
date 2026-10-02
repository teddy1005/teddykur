# Auth Testing Playbook

DB name: test_database (see backend/.env DB_NAME)

## Step 1: MongoDB
```
mongosh
use test_database
db.users.find({}, {email:1, role:1}).pretty()
db.users.findOne({role:"admin"}, {password_hash:1})
```
Verify bcrypt hash starts with `$2b$`. Index exists on users.email (unique).

## Step 2: API (same-origin preview URL)
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c /tmp/c.txt -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"teddykurnia10@gmail.com","password":"PopMonitor#2026"}'
curl -b /tmp/c.txt "$API/api/auth/me"
curl -b /tmp/c.txt "$API/api/dashboard"
```
Login returns user + sets access_token/refresh_token cookies. /me returns same user.

## Roles
- admin: full CRUD, settings, user mgmt
- operator: CRUD pops/links, resolve alerts, run checks, simulate faults
- viewer: read-only
