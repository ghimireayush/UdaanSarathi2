# CORS Solution Documentation

## 🚨 Problem
When running the React app locally (`http://localhost:3000`) and trying to make API calls to the backend (`https://dev.kaha.com.np`), browsers block the requests due to CORS (Cross-Origin Resource Sharing) policy.

**Error Message:**
```
Access to fetch at 'https://dev.kaha.com.np/job-portal/agency/register-owner' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## ✅ Solution Implemented

### 1. **Vite Proxy Configuration** (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://dev.kaha.com.np',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/job-portal')
      }
    }
  }
})
```

**How it works:**
- Requests to `/api/*` are proxied to `https://dev.kaha.com.np/job-portal/*`
- The proxy server handles CORS headers
- Browser sees requests as same-origin

### 2. **Environment-Aware API Service** (`src/services/apiService.js`)
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'  // Proxied in development
  : 'https://dev.kaha.com.np/job-portal';  // Direct in production
```

### 3. **Enhanced Error Handling**
```javascript
// Handle network errors (CORS, connection issues)
if (error.name === 'TypeError' && error.message.includes('fetch')) {
  throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
}
```

## 🔄 How to Use

### Development Mode:
1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **API calls automatically use proxy:**
   - Frontend: `http://localhost:3000`
   - API calls: `/api/agency/register-owner`
   - Proxied to: `https://dev.kaha.com.np/job-portal/agency/register-owner`

### Production Mode:
- API calls go directly to `https://dev.kaha.com.np/job-portal/*`
- Backend must have proper CORS headers configured

## 🛠️ Alternative Solutions

### Option 1: Browser Extension (Quick Fix)
- Install "CORS Unblock" or similar extension
- **⚠️ Not recommended for production**

### Option 2: Backend CORS Configuration
Ask backend team to add CORS headers:
```javascript
// Express.js example
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### Option 3: Chrome Flags (Development Only)
```bash
chrome --disable-web-security --user-data-dir="c:/chrome-dev-session"
```
**⚠️ Security risk - only for development**

## 🧪 Testing the Solution

### 1. **Restart Development Server**
```bash
npm run dev
```

### 2. **Test Registration Form**
- Fill out the registration form
- Submit and check browser network tab
- Should see requests to `/api/agency/register-owner`
- No CORS errors should appear

### 3. **Verify Proxy is Working**
- Open browser dev tools → Network tab
- Submit registration form
- Request URL should show: `http://localhost:3000/api/agency/register-owner`
- Response should come from the backend

## 📋 Troubleshooting

### Issue: Proxy not working
**Solution:** Restart the dev server after changing `vite.config.js`

### Issue: Still getting CORS errors
**Check:**
1. Vite config syntax is correct
2. Dev server restarted
3. Browser cache cleared
4. API service using correct base URL

### Issue: Production deployment fails
**Solution:** Ensure production build uses direct API URLs, not proxy paths

## 🚀 Production Deployment

### Frontend Deployment:
- Build uses direct API URLs
- No proxy configuration needed
- Ensure backend has CORS headers

### Backend Requirements:
```javascript
// Required CORS headers
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 📝 Summary

✅ **Development:** Vite proxy handles CORS seamlessly  
✅ **Production:** Direct API calls with backend CORS headers  
✅ **Error Handling:** User-friendly network error messages  
✅ **Testing:** Registration flow works without CORS issues  

The solution is transparent to developers and provides a smooth development experience while maintaining production compatibility.
