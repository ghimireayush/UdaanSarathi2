# Udaan Sarathi - Demo Credentials

## OTP-Based Login System

All login pages use **10-Digit Phone Number + 6-Digit OTP** authentication.

---

## Demo Credentials (4 Roles)

| Role | Phone Number | OTP | Login Page | Access Level |
|------|--------------|-----|------------|--------------|
| **Admin** | `9801234567` | `123456` | `/login` (Admin toggle) | Full admin access to agency dashboard |
| **Recipient** | `9801111111` | `123456` | `/login` (Member toggle) or `/login/member` | Manage job applications, applicant profiles |
| **Interview Coordinator** | `9802222222` | `123456` | `/login` (Member toggle) or `/login/member` | Schedule interviews, view applicant details |
| **Owner** | `9809999999` | `123456` | `/owner/login` | Super admin access to owner portal |

---

## Detailed Role Information

### 1. Admin (`/login` - Admin Toggle)
- **Phone Number:** `9801234567`
- **OTP:** `123456`
- **Role:** Administrator
- **Access:** Full admin access to agency dashboard, can manage all features

### 2. Recipient (`/login` - Member Toggle or `/login/member`)
- **Phone Number:** `9801111111`
- **OTP:** `123456`
- **Role:** Recipient/Recruiter
- **Access:** Can view and manage job applications, applicant profiles

### 3. Interview Coordinator (`/login` - Member Toggle or `/login/member`)
- **Phone Number:** `9802222222`
- **OTP:** `123456`
- **Role:** Interview Coordinator
- **Access:** Can schedule and manage interviews, view applicant details

### 4. Owner (`/owner/login`)
- **Phone Number:** `9809999999`
- **OTP:** `123456`
- **Role:** Platform Owner
- **Access:** Super admin access to owner portal, manages all agencies

---

## Login Features

### All Login Pages Include:
- ✅ 10-digit phone number input field with validation
- ✅ **"Send OTP" button** - Click to receive OTP (demo mode)
- ✅ **Resend OTP** - Available after 30-second cooldown
- ✅ **OTP Timer** - Shows countdown before resend is available
- ✅ 6-digit OTP input (numeric only, auto-formatted)
- ✅ Demo info box showing test credentials
- ✅ Success/Error messages with color coding
- ✅ Remember Me checkbox
- ✅ Admin/Member toggle (on `/login` page)
- ✅ Theme toggle (Light/Dark mode)
- ✅ Language switch (English/Nepali)
- ✅ Back button to public page

### Phone Number Format:
- Must be exactly 10 digits
- Numeric characters only
- No spaces or special characters
- Example: `9801234567`

### OTP Validation:
- Must be exactly 6 digits
- Numeric characters only
- Client-side validation before submission
- Large, centered display for easy reading

---

## Quick Access URLs

- **Public Landing:** `/public`
- **About Page:** `/about`
- **Admin/Member Login:** `/login`
- **Owner Login:** `/owner/login`
- **Register:** `/register`

---

## Notes

- **Authentication:** Phone number-based only (no usernames or emails for login)
- **Demo OTP:** Use `123456` for all demo accounts
- Theme preference persists across page navigation
- Language preference is saved in localStorage
- Remember Me functionality stores phone number for convenience

---

## Quick Test Guide

### Test Admin Login:
1. Go to `/login`
2. Ensure "Admin" toggle is selected
3. Enter phone: `9801234567`
4. Click **"Send OTP"** button (optional - for demo experience)
5. Enter OTP: `123456`
6. Click "Sign In"

### Test Owner Login:
1. Go to `/owner/login`
2. Enter phone: `9809999999`
3. Click **"Send OTP"** button (optional - for demo experience)
4. Enter OTP: `123456`
5. Click "Sign In"

### Test Recipient Login:
1. Go to `/login/member` or `/login` (Member toggle)
2. Enter phone: `9801111111`
3. Click **"Send OTP"** button (optional - for demo experience)
4. Enter OTP: `123456`
5. Click "Sign In"

### Test Coordinator Login:
1. Go to `/login/member` or `/login` (Member toggle)
2. Enter phone: `9802222222`
3. Click **"Send OTP"** button (optional - for demo experience)
4. Enter OTP: `123456`
5. Click "Sign In"

---

## OTP Features

### Send OTP Button:
- Appears next to phone number input
- Enabled only when 10-digit phone is entered
- Shows "Sending..." while processing
- Displays success message after sending
- Shows countdown timer (30s) before allowing resend

### Demo Mode Behavior:
- OTP is always `123456` for all accounts
- "Send OTP" simulates backend call (1 second delay)
- Success message shows: "OTP sent to [phone]. For demo, use: 123456"
- Green checkmark appears when OTP is sent
- In production, this would integrate with SMS gateway
