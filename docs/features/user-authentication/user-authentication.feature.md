# User Authentication

> **Template:** [Feature Template](../feature-template.md)

---

## Document Purpose

**This spec defines:**
- What user authentication does and why
- Authentication library used
- Required authentication methods to implement
- Account status management

**This spec does NOT define:**
- UI/UX design or interaction patterns
- Technical implementation details (handled by better-auth)
- API contracts, schemas, or performance requirements

---

User Authentication manages user registration, login, session management, and account security for the Pricing Intelligence Platform using **better-auth** library.

---

## Authentication Implementation

### Better-Auth

All authentication processes are handled by [better-auth](https://www.better-auth.com/) - a comprehensive authentication library that provides:

- User registration and login
- Session management
- Password hashing and security
- OAuth provider integration
- Email verification
- Password reset functionality
- Multi-session management
- Rate limiting and security features

### Required Authentication Methods

The following authentication methods must be configured in better-auth:

1. **Email & Password**
   - Standard email/password registration and login
   - Email verification flow
   - Password reset functionality

2. **OAuth Providers**
   - Google OAuth
   - GitHub OAuth

### Integration Points

The application must integrate with better-auth for:

1. **User Registration Flow**
   - After successful better-auth registration, create user record in database
   - Redirect to onboarding flow

2. **Login Flow**
   - Use better-auth session handling
   - Redirect authenticated users to dashboard

3. **Session Management**
   - Use better-auth session handling and validation

4. **Account Deletion**
   - Use better-auth account deletion functionality
   - Preserve billing records for 7 years (tax compliance)

### Configuration Requirements

Better-auth must be configured with:

- Session duration: 7 days
- Email verification required for email/password method
- Rate limiting: 5 login attempts per 15 minutes per IP
- Secure session cookies (httpOnly, secure, sameSite)
- Password requirements: minimum 8 characters with complexity rules
