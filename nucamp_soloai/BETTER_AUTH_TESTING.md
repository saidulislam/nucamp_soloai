# Better Auth API Testing Guide

This guide provides manual testing procedures for all Better Auth endpoints.

## Server Information
- **Base URL**: `http://localhost:5173`
- **API Base**: `http://localhost:5173/api/auth`

## Testing Tools

### Option 1: Browser (Easiest for GET requests)
Just open the URLs in your browser

### Option 2: curl (Command Line)
Use the commands provided below

### Option 3: Postman/Insomnia
Import the endpoints and test interactively

### Option 4: Browser DevTools
Use the Console tab to make fetch requests

---

## 1. Check Session (GET)

**Purpose**: Check if there's an active session

### Browser
```
http://localhost:5173/api/auth/session
```

### curl
```bash
curl -X GET http://localhost:5173/api/auth/session \
  -H "Content-Type: application/json" \
  -v
```

### Expected Response (No Session)
```json
{
  "user": null,
  "session": null
}
```

---

## 2. Sign Up with Email/Password (POST)

**Purpose**: Create a new user account

### curl
```bash
curl -X POST http://localhost:5173/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }' \
  -c cookies.txt \
  -v
```

### Browser DevTools Console
```javascript
fetch('http://localhost:5173/api/auth/sign-up/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  }),
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

### Expected Response (Success)
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false,
    "locale": "en",
    "timezone": "UTC",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "session": {
    "id": "...",
    "userId": "...",
    "expiresAt": "...",
    "token": "..."
  }
}
```

---

## 3. Sign In with Email/Password (POST)

**Purpose**: Authenticate an existing user

### curl
```bash
curl -X POST http://localhost:5173/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }' \
  -c cookies.txt \
  -v
```

### Browser DevTools Console
```javascript
fetch('http://localhost:5173/api/auth/sign-in/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123!'
  }),
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

### Expected Response (Success)
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    ...
  },
  "session": {
    "id": "...",
    "userId": "...",
    "expiresAt": "...",
    "token": "..."
  }
}
```

---

## 4. Sign Out (POST)

**Purpose**: End the current session

### curl (with cookies from sign-in)
```bash
curl -X POST http://localhost:5173/api/auth/sign-out \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

### Browser DevTools Console
```javascript
fetch('http://localhost:5173/api/auth/sign-out', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

### Expected Response
```json
{
  "success": true
}
```

---

## 5. Get User Info (GET)

**Purpose**: Get current authenticated user details

### Browser (after signing in)
```
http://localhost:5173/api/auth/user
```

### curl
```bash
curl -X GET http://localhost:5173/api/auth/user \
  -b cookies.txt \
  -v
```

---

## 6. Update User (POST)

**Purpose**: Update user profile information

### curl
```bash
curl -X POST http://localhost:5173/api/auth/update-user \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Name",
    "image": "https://example.com/avatar.jpg"
  }' \
  -v
```

---

## 7. List Sessions (GET)

**Purpose**: Get all active sessions for the current user

### Browser
```
http://localhost:5173/api/auth/list-sessions
```

### curl
```bash
curl -X GET http://localhost:5173/api/auth/list-sessions \
  -b cookies.txt \
  -v
```

---

## 8. Revoke Session (POST)

**Purpose**: Revoke a specific session

### curl
```bash
curl -X POST http://localhost:5173/api/auth/revoke-session \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sessionToken": "session_token_here"
  }' \
  -v
```

---

## 9. Revoke All Sessions (POST)

**Purpose**: Sign out from all devices

### curl
```bash
curl -X POST http://localhost:5173/api/auth/revoke-sessions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v
```

---

## Complete Testing Flow

### Step-by-Step Manual Test

1. **Start Fresh**
   ```bash
   # Clear any existing cookies
   rm -f cookies.txt
   ```

2. **Check Initial Session** (should be null)
   ```bash
   curl http://localhost:5173/api/auth/session
   ```

3. **Sign Up**
   ```bash
   curl -X POST http://localhost:5173/api/auth/sign-up/email \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"SecurePass123!","name":"Test User"}' \
     -c cookies.txt
   ```

4. **Check Session Again** (should have user data)
   ```bash
   curl -b cookies.txt http://localhost:5173/api/auth/session
   ```

5. **Sign Out**
   ```bash
   curl -X POST http://localhost:5173/api/auth/sign-out \
     -b cookies.txt
   ```

6. **Verify Signed Out**
   ```bash
   curl -b cookies.txt http://localhost:5173/api/auth/session
   ```

7. **Sign In**
   ```bash
   curl -X POST http://localhost:5173/api/auth/sign-in/email \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"SecurePass123!"}' \
     -c cookies.txt
   ```

8. **Check Session** (should be authenticated)
   ```bash
   curl -b cookies.txt http://localhost:5173/api/auth/session
   ```

---

## Browser Testing (Easiest Method)

Open your browser's DevTools (F12), go to the Console tab, and run:

```javascript
// 1. Check initial session
await fetch('/api/auth/session', {credentials: 'include'}).then(r => r.json()).then(console.log)

// 2. Sign up
await fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123!',
    name: 'Test User'
  }),
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// 3. Check session (should be logged in)
await fetch('/api/auth/session', {credentials: 'include'}).then(r => r.json()).then(console.log)

// 4. Sign out
await fetch('/api/auth/sign-out', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// 5. Check session (should be null)
await fetch('/api/auth/session', {credentials: 'include'}).then(r => r.json()).then(console.log)

// 6. Sign in
await fetch('/api/auth/sign-in/email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123!'
  }),
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// 7. Final session check
await fetch('/api/auth/session', {credentials: 'include'}).then(r => r.json()).then(console.log)
```

---

## Database Verification

Check the database to see created users:

```bash
# Access Prisma Studio
cd /Users/saidulislam/Solo\ AI\ Tech\ Entrepreneur/2-build-a-saas-business/nucamp_soloai/nucamp_soloai
npm run db:studio
```

Then open http://localhost:5555 in your browser to view:
- `user` table - see created users
- `session` table - see active sessions
- `account` table - OAuth connections (will be empty for email/password)
- `verification` table - email verification tokens

---

## Troubleshooting

### Issue: 404 Not Found
- **Solution**: Make sure the dev server is running on port 5173
- Check: `http://localhost:5173` should load your app

### Issue: Endpoints Hang
- **Solution**: Check the dev server logs for errors
- Try restarting: Kill the server and run `npm run dev` again

### Issue: Session Not Persisting
- **Solution**: Make sure you're using `-c cookies.txt` and `-b cookies.txt` with curl
- Or use `credentials: 'include'` with fetch in the browser

### Issue: Password Too Weak
- Minimum 8 characters required
- Use a mix of letters, numbers, and special characters

---

## Success Criteria

✅ All endpoints should return proper JSON responses
✅ Sign-up should create a new user in the database
✅ Sign-in should return user and session data
✅ Session should persist across requests with cookies
✅ Sign-out should clear the session
✅ Protected endpoints should require authentication

