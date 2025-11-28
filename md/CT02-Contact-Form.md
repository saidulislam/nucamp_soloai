# Contact Form Implementation

## Overview
Create a comprehensive contact form component for the `/contact` route to enable users to submit inquiries and support requests with proper validation, error handling, and integration with existing authentication system.

## Requirements

### User Stories
- As a guest user, I want to fill out a contact form with my name, email, and message so that I can reach the support team
- As an authenticated user, I want the form to pre-populate with my account information so that I don't have to re-enter my details
- As a user, I want to see clear validation feedback so that I know if my submission was successful or if I need to fix any errors
- As a user, I want to receive confirmation that my message was sent so that I know the support team will respond

### UI/UX Requirements
- Clean, single-column form layout using DaisyUI components with proper spacing and visual hierarchy
- Form fields: Name (text), Email (email), Subject (text), Message (textarea)
- Primary submit button with loading states and disabled appearance during processing
- Mobile-first responsive design with minimum 44px touch targets
- Real-time validation with inline error messages below each field
- Success confirmation message with auto-dismiss after 5 seconds
- Form reset functionality after successful submission

### User Flow
1. User navigates to `/contact` page
2. Form loads with authentication-aware field population
3. User fills out required fields with real-time validation feedback
4. User submits form → loading state → success/error message
5. Successful submission shows confirmation and resets form

### Functional Requirements
- **Authentication Integration**: Pre-populate name and email fields for authenticated users using Better Auth session data
- **Form Validation**: Client-side validation for required fields, email format (RFC 5322 compliant), and message length (minimum 10 characters, maximum 2000 characters)
- **Submission Handling**: Process form submissions through SvelteKit server action with proper error handling and response formatting
- **Email Delivery**: Send form submissions via email using configured email provider from Better Auth setup
- **CSRF Protection**: Implement CSRF token validation for form submissions
- **Rate Limiting**: Limit submissions to maximum 3 per IP address per hour
- **Input Sanitization**: Sanitize all user input to prevent XSS attacks and injection vulnerabilities

### Data Requirements
- **Form Fields**:
  - name: string (required, 2-100 characters)
  - email: string (required, valid email format)
  - subject: string (required, 5-200 characters)
  - message: string (required, 10-2000 characters)
- **Submission Data**: Store submission timestamp, IP address (hashed), and user ID if authenticated
- **No Database Storage**: Form submissions sent directly via email without database persistence

### Security Considerations
- Input validation and sanitization on both client and server side
- CSRF protection using SvelteKit's built-in protection
- Rate limiting to prevent spam submissions
- Email injection protection through proper email header validation
- IP address hashing for privacy compliance

### Performance Requirements
- Form must render within 500ms on page load
- Real-time validation feedback within 100ms of user input
- Form submission processing within 3 seconds under normal conditions
- Success/error feedback appears within 200ms of server response

## Technical Specifications

### Dependencies
- Existing Better Auth client setup from AU04-Global-Client-Setup.md
- Main layout component from A02-Create-Layout-Component.md
- Paraglide i18n system from PG02-Paraglide-Configure-Langs.md
- Email provider configuration from AU02-BetterAuth-Init.md
- Tailwind CSS and DaisyUI from A03-Configure-Tailwind-DaisyUI.md

### Database Changes
No database schema changes required - form submissions are processed via email only.

### API Changes
- Add form submission handler in `src/routes/contact/+page.server.ts`
- Implement server-side validation and email sending functionality
- Return structured JSON responses for success/error states

### Environment Variables
- Uses existing email configuration from Better Auth setup:
  - `EMAIL_FROM`
  - `EMAIL_SERVER_HOST`
  - `EMAIL_SERVER_PORT`
  - `EMAIL_SERVER_USER`
  - `EMAIL_SERVER_PASSWORD`

## Integration Points

### Authentication Integration
- Import Better Auth client from AU04-Global-Client-Setup.md
- Check authentication status using existing session management
- Pre-populate form fields with user.name and user.email when authenticated
- Display different form labels for authenticated vs guest users

### Layout Integration
- Use main layout component established in A02-Create-Layout-Component.md
- Integrate with existing navigation and footer components
- Maintain consistent styling with other pages

### Internationalization
- Create translation keys in Paraglide message catalogs for all form labels, placeholders, validation messages, and success/error feedback
- Support English (default), Spanish (es), and French (fr) languages
- Follow established translation key structure: `contact.form.*`

### Email Integration
- Utilize existing email provider configuration from Better Auth setup
- Send HTML-formatted emails with form submission details
- Include anti-spam headers and proper email authentication

## Component Architecture

### File Structure
```
src/routes/contact/
├── +page.svelte (main contact page)
├── +page.ts (load function for authentication check)
└── +page.server.ts (form submission handler)

src/lib/components/contact/
├── ContactForm.svelte (main form component)
├── ContactFormField.svelte (reusable form field)
└── ContactSuccess.svelte (success message component)
```

### Form Validation Rules
- Name: Required, 2-100 characters, no special characters except hyphens and apostrophes
- Email: Required, RFC 5322 compliant format validation
- Subject: Required, 5-200 characters, basic text validation
- Message: Required, 10-2000 characters, HTML tag stripping

### Email Template Structure
- Subject line: "[Contact Form] {subject}"
- Sender information: Name, email, authentication status
- Message content with proper formatting
- Timestamp and IP address (hashed) for tracking
- Reply-to header set to user's email address

## Accessibility Requirements
- WCAG 2.1 AA compliance with proper form labels and ARIA attributes
- Error messages announced via screen readers using ARIA live regions
- Keyboard navigation support with proper tab order
- Focus management during form submission and error states
- High contrast error and success message styling

## Performance Optimization
- Form component lazy loading if not immediately visible
- Debounced validation to prevent excessive API calls
- Client-side caching of validation messages
- Optimized email delivery with connection pooling