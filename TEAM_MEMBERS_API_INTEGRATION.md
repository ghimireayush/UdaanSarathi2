# Team Members API Integration Documentation

## Overview
This document describes the integration between the auth documentation (`auth_docs/mem.yaml` and `auth_docs/mem.md`) and the `/teammembers` invite functionality in the UdaanSarathi application.

## API Specification Integration

### Endpoint
- **URL**: `https://dev.kaha.com.np/job-portal/agencies/owner/members/invite`
- **Method**: POST
- **Content-Type**: application/json

### Request Format
```json
{
  "full_name": "string",
  "phone": "string", 
  "role": "staff" | "admin" | "manager"
}
```

### Response Format
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "phone": "string",
  "role": "string",
  "dev_password": "string"
}
```

## Implementation Changes

### 1. Member Service (`src/services/memberService.js`)

#### Key Updates:
- **API Integration**: Added real API call to the specified endpoint with fallback to mock implementation
- **Field Mapping**: Updated to use `full_name`, `phone`, `role` instead of `name`, `mobileNumber`, `role`
- **Role Validation**: Enforces API-specified roles: `staff`, `admin`, `manager`
- **Response Handling**: Processes API response including `dev_password` field
- **Error Handling**: Comprehensive error handling with fallback to mock data
- **Backward Compatibility**: Maintains both old and new field formats for smooth transition

#### API Configuration:
```javascript
const API_BASE_URL = 'https://dev.kaha.com.np';
const MEMBERS_INVITE_ENDPOINT = '/job-portal/agencies/owner/members/invite';
```

### 2. Members Component (`src/pages/Members.jsx`)

#### Key Updates:
- **Form Fields**: Updated to use `full_name`, `phone` instead of `name`, `mobileNumber`
- **Role Options**: Changed to API-specified roles (`staff`, `admin`, `manager`)
- **Display Logic**: Enhanced to handle both old and new field formats
- **Password Display**: Shows temporary password when provided by API
- **Search Functionality**: Updated to work with both field formats
- **Validation**: Client-side validation matches API requirements

#### Form Structure:
```jsx
const [formData, setFormData] = useState({
  full_name: '',
  role: 'staff',
  phone: ''
});
```

## Features

### 1. Dual Mode Operation
- **Production Mode**: Makes real API calls to the specified endpoint
- **Development Mode**: Falls back to mock implementation if API is unavailable
- **Backward Compatibility**: Supports both old and new data formats

### 2. Enhanced Security
- **Role Validation**: Enforces API-specified role constraints
- **Phone Validation**: Validates phone number format and uniqueness
- **Temporary Passwords**: Displays dev_password from API response

### 3. Error Handling
- **API Errors**: Graceful handling of network and server errors
- **Validation Errors**: Clear user feedback for validation failures
- **Fallback Mechanism**: Automatic fallback to mock data during development

### 4. Audit Logging
- **API Calls**: Logs successful API invitations with metadata
- **Mock Calls**: Logs mock invitations with special flag
- **Security Info**: Tracks password generation and role assignments

## Usage Examples

### Inviting a Staff Member
```javascript
await inviteMember({
  full_name: "John Doe",
  phone: "9876543210",
  role: "staff"
});
```

### API Response Handling
```javascript
// API returns:
{
  "id": "uuid-here",
  "phone": "9876543210", 
  "role": "staff",
  "dev_password": "temp123"
}

// Transformed to internal format:
{
  id: "uuid-here",
  name: "John Doe",           // For compatibility
  full_name: "John Doe",      // API format
  phone: "9876543210",        // API format  
  mobileNumber: "9876543210", // For compatibility
  role: "staff",
  status: "pending",
  dev_password: "temp123",
  createdAt: "2025-09-17T..."
}
```

## Migration Strategy

### Phase 1: Dual Format Support ✅
- Support both old and new field formats
- Maintain backward compatibility
- Add API integration with fallback

### Phase 2: API Transition
- Monitor API reliability
- Gradually reduce mock fallback usage
- Update existing data to new format

### Phase 3: Legacy Cleanup
- Remove old field format support
- Clean up mock data
- Finalize API-only implementation

## Testing

### Manual Testing
1. **Form Submission**: Test with all three roles (staff, admin, manager)
2. **API Fallback**: Test behavior when API is unavailable
3. **Validation**: Test phone number and name validation
4. **Display**: Verify temporary password display

### Integration Testing
1. **API Connectivity**: Verify connection to dev.kaha.com.np
2. **Response Handling**: Test various API response scenarios
3. **Error Cases**: Test network failures and invalid responses
4. **Audit Logging**: Verify audit events are properly logged

## Configuration

### Environment Variables (Future)
```env
REACT_APP_API_BASE_URL=https://dev.kaha.com.np
REACT_APP_MEMBERS_ENDPOINT=/job-portal/agencies/owner/members/invite
```

### Authorization (Future Implementation)
```javascript
headers: {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
}
```

## Troubleshooting

### Common Issues
1. **API Unavailable**: Check network connectivity and API endpoint
2. **Invalid Role**: Ensure role is one of: staff, admin, manager
3. **Duplicate Phone**: Phone numbers must be unique
4. **Missing Fields**: All three fields (full_name, phone, role) are required

### Debug Information
- Check browser console for API call logs
- Look for "Mock implementation" messages during fallback
- Verify audit logs for invitation tracking
- Check dev_password display for successful API calls

## Security Considerations

### Data Protection
- Temporary passwords are displayed only to authorized users
- Phone numbers are validated for format and uniqueness
- Role assignments are restricted to API-specified values

### API Security
- HTTPS endpoint ensures encrypted communication
- Authorization headers will be added in future updates
- Input validation prevents malicious data submission

## Future Enhancements

### Planned Features
1. **Authentication Integration**: Add proper JWT token handling
2. **Role Permissions**: Implement role-based access control
3. **Bulk Invitations**: Support multiple member invitations
4. **Email Notifications**: Send invitation emails via API
5. **Member Management**: Full CRUD operations via API

### API Improvements
1. **Pagination**: Support for large member lists
2. **Filtering**: Server-side filtering and search
3. **Status Updates**: Real-time member status synchronization
4. **Webhooks**: Event notifications for member changes
