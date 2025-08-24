# Authentication System

This document describes the authentication system implemented for the Dog Kennel management application.

## Overview

The authentication system uses Supabase Auth with email/password authentication. Only manually created users can log in - there is no self-registration functionality.

## Components

### 1. Authentication Service (`src/services/supabaseService.ts`)

```typescript
export const authService = {
  signIn(email: string, password: string)
  signOut()
  getCurrentUser()
  getCurrentSession()
  onAuthStateChange(callback)
}
```

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)

Provides global authentication state management:

- `user`: Current authenticated user
- `session`: Current auth session
- `loading`: Authentication loading state
- `signIn()`: Sign in function
- `signOut()`: Sign out function

### 3. Login Page (`src/pages/LoginPage.tsx`)

- Clean, professional login form
- Email and password inputs
- Error handling and loading states
- Redirects to intended page after login
- Informs users that only authorized accounts can access the system

### 4. Protected Route Component (`src/components/ProtectedRoute.tsx`)

- Wraps protected pages/routes
- Redirects unauthenticated users to login
- Shows loading state during auth check
- Preserves intended destination for post-login redirect

## Route Protection

The following routes are protected and require authentication:

- `/dogs` - Dogs overview page
- `/dogs/:id` - Dog details page
- `/archive` - Archive page

The following routes are public:

- `/` - Home page
- `/login` - Login page
- `/about` - About page

## User Interface Integration

### Navigation Bar

- **Not Authenticated**: Shows "Login" button
- **Authenticated**: Shows user email and "Logout" button

### Login Flow

1. User clicks "Login" button → Navigates to `/login`
2. User enters credentials → Calls `authService.signIn()`
3. Success → Redirects to intended destination or home
4. Error → Shows error message

### Logout Flow

1. User clicks "Logout" button → Calls `authService.signOut()`
2. User state cleared → Redirects to home page

## User Management

### Creating Users

Users must be created manually through the Supabase dashboard:

1. Go to Authentication > Users in Supabase dashboard
2. Click "Add user"
3. Enter email and password
4. User can now log in to the application

### User Roles

The current system uses Supabase's built-in RLS (Row Level Security) policies:

- **Anonymous users**: Can read all data
- **Authenticated users**: Can create, update, and delete data

## Security Features

1. **Route Protection**: Sensitive pages redirect to login
2. **Session Management**: Automatic session restoration on page reload
3. **Row Level Security**: Database-level access control
4. **Protected Actions**: Only authenticated users can modify data

## Environment Variables

No additional environment variables required - uses existing Supabase configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Error Handling

- Network errors during login are displayed to user
- Invalid credentials show appropriate error message
- Session expiry automatically redirects to login
- Loading states prevent UI confusion

## Future Enhancements

Potential improvements for the authentication system:

1. **Role-based permissions** (Admin, Editor, Viewer)
2. **Password reset functionality**
3. **Email verification**
4. **Remember me option**
5. **Multi-factor authentication**
6. **User profile management**
