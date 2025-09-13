# Udaan Sarathi - Recruitment Portal

A comprehensive agency-facing recruitment management portal built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd udaan-sarathi

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔐 Authentication System

The application includes a complete authentication system with:

- **Login Page**: Secure login interface with username/password authentication
- **Role-Based Access Control**: Different access levels for Admin, Recruiter, and Coordinator roles
- **Session Management**: User session tracking with automatic expiration
- **User Context**: Application-wide user context with role-based permissions

### Demo Credentials

Demo credentials are available in the [sep3.md](sep3.md) file. The system includes three user roles:

- **Admin** (`admin@udaan.com`/`password`): Full access to all application features including Audit Log
- **Recruiter** (`recruiter@udaan.com`/`password`): Access to job postings, applications, and interview scheduling
- **Coordinator** (`coordinator@udaan.com`/`password`): Limited access to workflow management functions

## 🎨 Tailwind CSS Setup

This project uses Tailwind CSS for styling. If you see "Unknown at rule" warnings in VS Code, follow these steps:

### Option 1: Install Tailwind CSS IntelliSense Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Tailwind CSS IntelliSense"
4. Install the extension by Brad Cornes

### Option 2: VS Code Settings (Already Configured)
The project includes `.vscode/settings.json` that disables CSS validation warnings for Tailwind directives.

### Option 3: Manual VS Code Configuration
Add this to your VS Code `settings.json`:
```json
{
  "css.validate": false,
  "less.validate": false, 
  "scss.validate": false,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns + date-fns-tz
- **Nepali Calendar**: nepali-date-converter

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.jsx
│   ├── Loading.jsx
│   ├── ToastProvider.jsx
│   ├── ConfirmProvider.jsx
│   ├── DateDisplay.jsx
│   ├── NepaliCalendar.jsx
│   ├── Layout.jsx
│   ├── InterviewScheduling.jsx
│   ├── ScheduledInterviews.jsx
│   ├── PrivateRoute.jsx
│   ├── ProtectedRoute.jsx
│   └── ui/
│       └── Card.jsx
├── pages/              # Main application pages
│   ├── Dashboard.jsx
│   ├── Jobs.jsx
│   ├── JobDetails.jsx
│   ├── Applications.jsx
│   ├── Interviews.jsx
│   ├── Workflow.jsx
│   ├── Drafts.jsx
│   ├── AgencySettings.jsx
│   ├── AuditLog.jsx
│   └── Login.jsx
├── services/           # API layer
│   ├── authService.js
│   ├── auditService.js
│   └── index.js
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── hooks/              # React Query hooks
│   └── useApi.js
├── data/               # Mock data
│   └── mockData.js
├── utils/              # Utility functions
│   └── nepaliDate.js
├── assets/             # Static assets
│   └── logo.svg
└── index.css           # Global styles
```

## 🌟 Key Features

- **🔐 User Authentication** - Secure login with role-based access control
- **📊 Analytics Dashboard** - Real-time recruitment metrics
- **💼 Job Management** - Create, edit, and manage job postings
- **👥 Application Tracking** - Centralized candidate management
- **📅 Interview Scheduling** - Advanced scheduling with Nepali calendar
- **🔄 Workflow Management** - Post-interview pipeline
- **📝 Draft Management** - Save and manage job drafts
- **⚙️ Agency Settings** - Configure agency profile
- **📋 Audit Log** - Track all system activities (Admin only)
- **🌐 Responsive Design** - Mobile-first approach
- **♿ Accessibility** - WCAG compliant
- **🗓️ Nepali Calendar** - Full BS calendar integration
- **⚡ Performance** - Optimized loading and caching

## 🧭 Navigation Structure

The application follows a logical navigation structure:

1. **Dashboard** (Analytics) - Overview of key metrics
2. **Jobs** - Job listing and management
3. **Drafts** - Manage job drafts
4. **Applications** - Track all job applications
5. **Interviews** - Schedule and manage interviews
6. **Workflow** - Post-interview candidate workflow
7. **Audit Log** - System-wide audit trail (Admin only)
8. **Agency Settings** - Configure agency profile

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (when configured)

### CSS Validation Warnings
The "Unknown at rule @tailwind" warnings are normal and don't affect functionality. They occur because:
1. VS Code doesn't recognize Tailwind CSS directives by default
2. The project is properly configured with PostCSS and Tailwind
3. The application builds and runs correctly

To eliminate these warnings, install the Tailwind CSS IntelliSense extension or use the provided VS Code settings.

## 🌍 Internationalization

The application supports both English and Nepali date formats with proper timezone handling for Asia/Kathmandu.

## 🔧 Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration  
- `vite.config.js` - Vite build configuration
- `.vscode/settings.json` - VS Code workspace settings
- `.vscode/extensions.json` - Recommended extensions

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.