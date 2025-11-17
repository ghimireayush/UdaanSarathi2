# Logout Redirect Update

## Changes Made

Updated logout functionality to redirect users to their respective login pages based on their role.

---

## Updated Files

### 1. `src/components/Layout.jsx`

**Before:**
```javascript
const handleLogout = () => {
  logout();
  navigate("/login");
};
```

**After:**
```javascript
const handleLogout = () => {
  // Determine redirect path based on user role
  const redirectPath = (user?.role === 'recipient' || user?.role === 'interview-coordinator') 
    ? '/login/member' 
    : '/login';
  
  logout();
  navigate(redirectPath);
};
```

### 2. `src/components/OwnerLayout.jsx`

**Already Correct:**
```javascript
const handleLogout = async () => {
  await logout();
  navigate("/owner/login");
};
```

---

## Logout Behavior by Role

| Role | Logout Redirect | Login Page |
|------|----------------|------------|
| **Admin** | `/login` | Admin login page |
| **Owner** | `/owner/login` | Owner portal login |
| **Recipient** | `/login/member` | Member login page |
| **Interview Coordinator** | `/login/member` | Member login page |

---

## How It Works

1. **Admin Logout:**
   - User clicks logout from admin dashboard
   - Redirected to `/login` (Admin login page)

2. **Owner Logout:**
   - User clicks logout from owner portal
   - Redirected to `/owner/login` (Owner login page)

3. **Member Logout (Recipient/Coordinator):**
   - User clicks logout from member dashboard
   - Redirected to `/login/member` (Member login page)

---

## Benefits

✅ Better user experience - users return to their appropriate login page
✅ Maintains context - users don't get confused about which portal to use
✅ Consistent flow - logout takes you back to where you logged in
✅ Role-based routing - automatic detection based on user role

---

## Testing

### Test Admin Logout:
1. Login as Admin (phone: 9801234567)
2. Click logout
3. Should redirect to `/login`

### Test Owner Logout:
1. Login as Owner (phone: 9809999999)
2. Click logout
3. Should redirect to `/owner/login`

### Test Recipient Logout:
1. Login as Recipient (phone: 9801111111)
2. Click logout
3. Should redirect to `/login/member`

### Test Coordinator Logout:
1. Login as Coordinator (phone: 9802222222)
2. Click logout
3. Should redirect to `/login/member`
