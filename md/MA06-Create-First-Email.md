# Create First Marketing Email in Mautic

## IMPORTANT IMPLEMENTATION NOTE
All configuration and setup for Mautic must be performed exclusively through the official Mautic interfaces:
- Mautic Web UI (Admin Dashboard)
- Mautic REST API
- Mautic CLI Tools

Directly injecting code, editing core source files, or programmatically modifying the Mautic application files, configuration files, or database to create or modify entities is STRICTLY PROHIBITED.

This restriction ensures:
- System consistency and database integrity
- Compatibility with future Mautic updates and plugins
- Maintainability and ease of troubleshooting
- Full support for automation, validation, and permissions features

Do NOT create or modify Mautic entities, configurations, or features by editing PHP files, configuration files, or the database directly.
Always use only the Web UI, official REST API, or CLI commands as documented by Mautic.
If actions are required using the UI, ask the user to perform them through the Mautic Admin interface or provide instructions for using the Mautic CLI.

## Overview
Create and publish a professional welcome/onboarding email in Mautic using the WYSIWYG email builder with dynamic contact variables, company branding, and personalized content to engage new users and guide initial product setup.

**Feature Type**: Technical Integration

**Business Value**: Establishes automated marketing communication that improves user activation rates, reduces churn, and delivers consistent brand experience to new users immediately after registration.

## Requirements

### Functional Requirements
- **Email Template Creation**: Design professional welcome email using Mautic's WYSIWYG editor with drag-and-drop components
- **Dynamic Content**: Include personalized variables (firstName, lastName, email, registrationDate) from contact records
- **Brand Consistency**: Apply company branding including logo, colors, typography, and visual hierarchy
- **Call-to-Action**: Include clear primary CTA directing users to complete profile or explore key features
- **Content Structure**: Welcome message, value proposition, next steps, and support contact information
- **Mobile Responsiveness**: Email must render properly across desktop, tablet, and mobile devices
- **Deliverability Optimization**: Follow email best practices for spam score below 5 and high deliverability rates

### User Stories
- **As a new user**, I want to receive a personalized welcome email so that I feel valued and understand next steps
- **As a marketing manager**, I want to create branded emails so that all communications maintain consistent brand identity
- **As a product manager**, I want to guide user onboarding so that activation rates improve and users find value quickly

### Technical Requirements
- **Mautic Version**: 5.0+ with campaign builder and email editor capabilities
- **Email Builder**: Use drag-and-drop WYSIWYG editor with template components
- **Variable Integration**: Implement Mautic contact tokens for dynamic personalization
- **Template Storage**: Save template for reuse and future modifications
- **Testing Capability**: Send test emails to verify rendering and functionality
- **Publishing Workflow**: Activate email for use in automated campaigns

## Technical Specifications

### Dependencies
- Completed Mautic container setup from `MA01-Mautic-Container-Setup.md`
- Mautic admin user account with email creation permissions
- Campaign infrastructure from `MA03-Mautic-Create-Campaign.md`

### Integration Points
- **Contact Variables**: Connect to contact fields populated by Better Auth integration
- **Campaign Triggers**: Email triggers when contact is added to "New Signups" segment
- **Branding Assets**: Upload logo and brand assets to Mautic media library

### Email Configuration
- **From Address**: Use verified domain email address for authentication compliance
- **Subject Line**: Personalized welcome message with contact's first name
- **Preheader Text**: Compelling preview text visible in email clients
- **Template Components**: Header with logo, personalized greeting, value proposition, feature highlights, CTA button, footer with unsubscribe
- **Contact Tokens**: `{contactfield=firstname}`, `{contactfield=lastname}`, `{contactfield=email}`

### Environment Variables
No new environment variables required - uses existing Mautic admin credentials.

## Content Requirements

### Email Template Structure
1. **Header Section**: Company logo, branded colors, consistent typography
2. **Personalized Greeting**: "Welcome [FirstName]!" with dynamic contact variable
3. **Welcome Message**: Brief, friendly introduction expressing excitement about their registration
4. **Value Proposition**: 2-3 key benefits or features that highlight product value
5. **Next Steps**: Clear guidance on what users should do first (complete profile, explore features, etc.)
6. **Primary CTA**: Prominent button directing to specific action (e.g., "Complete Your Profile", "Explore Features")
7. **Support Information**: Contact details or help resources for questions
8. **Footer**: Company information, unsubscribe link, social media links

### Content Guidelines
- **Tone**: Professional but friendly, welcoming and supportive
- **Length**: Concise content that can be scanned quickly (under 200 words)
- **Mobile-First**: Content hierarchy works on small screens
- **Accessibility**: Alt text for images, sufficient color contrast, clear link text

## Security Considerations
- **Email Authentication**: Ensure SPF, DKIM records configured for sending domain
- **Unsubscribe Compliance**: Include mandatory unsubscribe link per CAN-SPAM requirements
- **Data Privacy**: Handle contact variables according to GDPR/privacy regulations
- **Link Safety**: All CTAs link to secure HTTPS endpoints within application domain

## Performance Requirements
- **Email Rendering**: Template must render within 3 seconds across major email clients
- **Image Optimization**: Compress images to under 200KB total for fast loading
- **Template Size**: Keep HTML under 100KB for optimal deliverability
- **Mobile Performance**: Email loads and displays properly on mobile devices within 5 seconds

## Prerequisites
- `MA01-Mautic-Container-Setup.md` - Mautic container running with admin access
- `MA03-Mautic-Create-Campaign.md` - Campaign structure and automation workflow established

## Additional Context for AI Assistant

### Mautic Email Builder Navigation
- Access email builder through Mautic admin panel at `http://localhost:8080/admin`
- Navigate to Channels → Emails → New to create new email template
- Use "Template" type for reusable templates, "Segment Email" for campaign integration

### Dynamic Variable Implementation
- Contact tokens use format `{contactfield=fieldname}` for database fields
- Common variables: `{contactfield=firstname}`, `{contactfield=lastname}`, `{contactfield=email}`
- Date formatting: `{contactfield=date_added|date('M j, Y')}` for registration date

### Email Testing Workflow
1. Create email template with placeholder content
2. Add dynamic variables and personalization
3. Send test email to personal email address
4. Verify rendering across desktop and mobile
5. Check spam score using Mautic's built-in analysis
6. Publish email for campaign use

### Brand Integration
- Upload company logo to Mautic media library before email creation
- Use consistent color palette matching application branding
- Apply same typography hierarchy used in main application
- Maintain visual consistency with website and application interface

## Success Criteria
- Email template created and saved in Mautic system
- Dynamic contact variables populate correctly in test emails
- Professional design matches brand guidelines and renders properly across devices
- Email achieves spam score below 5 for optimal deliverability
- Template ready for integration with automated welcome campaign
- Test emails sent successfully with proper personalization