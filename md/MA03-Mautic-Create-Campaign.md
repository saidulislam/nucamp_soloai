# MA03-Mautic-Create-Campaign.md

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

Create a complete welcome email campaign for **Lupin Learn** to onboard newly authenticated users. This implementation includes:

1. **Segment Creation**: Create a "New Authenticated Users" segment targeting contacts who have provided first name, last name, and email
2. **Campaign Setup**: Design a welcome campaign that triggers automatically for new users
3. **First Email**: Create a professional welcome email introducing Lupin Learn's AI tools for teachers

**Product Context**: See `/docs/Lupin-Learn-PRD.md` for complete product requirements. Lupin Learn is an AI tools platform that helps K-12 and higher education teachers save up to 10 hours per week by automating repetitive tasks like grading, lesson planning, and student communication.

**Business Value**: Automated onboarding improves user activation rates, reduces churn, and provides consistent brand experience while introducing teachers to the platform's 40+ AI tools.

**Feature Type**: Technical Integration

## Requirements

### For Technical Integrations, include:
- **Service Details**: Mautic 5.0+ campaign builder, email editor, contact segmentation, and automation workflows
- **Authentication**: Uses existing Mautic admin credentials from MA01-Mautic-Container-Setup.md
- **Integration Points**: Connects to contact provisioning from MA05-Mautic-Frontend-Connect.md

### Functional Requirements
- **Segment Creation**: Create "New Authenticated Users" segment with filters for contacts who have:
  - First name (not empty)
  - Last name (not empty)
  - Email (not empty and valid)
  - Recently created (joined within last 30 days)
- **Campaign Creation**: Design "Welcome to Lupin Learn" campaign with automatic triggers
- **Email Content**: Create welcome email introducing Lupin Learn's value proposition and core AI tools
- **Automation Flow**: Campaign triggers when contacts are added to the segment
- **Testing**: Send test emails and verify campaign triggers correctly with new user registrations

### Data Requirements
- **Contact Variables**: Utilize firstname, lastname, email fields from Better Auth integration (MA02-Mautic-API-Auth.md)
- **Required Fields**: Contacts must have all three fields populated to enter segment
- **Campaign Metrics**: Track open rates, click-through rates, and tool engagement
- **Segmentation Data**: Target authenticated users who completed registration with full profile

### Security Considerations
- **Email Authentication**: Configure SPF, DKIM, and DMARC records for email deliverability
- **Unsubscribe Management**: Include mandatory unsubscribe links and honor opt-out requests
- **Data Privacy**: Respect GDPR compliance with proper consent management

### Performance Requirements
- **Email Delivery**: Campaign emails must be sent within 5 minutes of trigger conditions
- **Processing Speed**: Campaign workflows must process up to 100 new contacts per hour
- **Deliverability**: Maintain email deliverability rate above 95% with spam score below 5

## Technical Specifications

### Dependencies
- Existing Mautic 5.0+ container from MA01-Mautic-Container-Setup.md
- Mautic API credentials from MA02-Mautic-API-Auth.md
- Contact provisioning integration from MA05-Mautic-Frontend-Connect.md
- SMTP configuration for email delivery

### Database Changes
- No direct database changes required (Mautic handles campaign storage internally)
- Campaign data stored in Mautic's campaign tables
- Email statistics and tracking data automatically generated

### API Changes
- No new API endpoints required
- Uses existing Mautic REST API for campaign management and monitoring
- Webhook endpoints may be configured for campaign event tracking

### Environment Variables
- Uses existing MAUTIC_URL and MAUTIC_API credentials
- Optional: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD for email delivery
- EMAIL_FROM_ADDRESS and EMAIL_FROM_NAME for sender identification

## Campaign Configuration Requirements

### Email Template Design
- **Subject Line**: Personalized welcome message with contact's first name
- **Header Section**: Company branding, logo, and welcoming headline
- **Content Sections**: Product introduction, key features overview, and next steps guidance
- **Call-to-Action**: Clear buttons linking to account dashboard, feature tour, or documentation
- **Footer**: Contact information, social media links, and unsubscribe option

### Campaign Automation Flow
- **Trigger**: New contact added to "New Signups" segment
- **Delay**: Send welcome email immediately upon trigger
- **Follow-up**: Optional second email after 7 days for users who haven't logged in
- **Conditions**: Check contact engagement and adjust email frequency accordingly

### Personalization Variables
- Use Mautic's contact field tokens: {contactfield=firstname}, {contactfield=lastname}, {contactfield=email}
- Dynamic content based on registration source or user preferences
- Personalized product recommendations based on signup context

### Testing and Quality Assurance
- **Preview Testing**: Test email rendering across desktop and mobile clients
- **Spam Testing**: Verify spam score and deliverability using Mautic's email testing tools
- **Variable Testing**: Confirm all dynamic variables populate correctly with contact data
- **Automation Testing**: Verify campaign triggers correctly with new contact creation from Better Auth integration

## Integration with Existing System

### Prerequisites
- MA01-Mautic-Container-Setup.md: Mautic container running at localhost:8080
- MA02-Mautic-API-Auth.md: API credentials for programmatic access
- MA05-Mautic-Frontend-Connect.md: Contact provisioning from signup/login flows

### Content Preparation
- Welcome message copy emphasizing product value proposition
- Feature highlights matching content from SP02-Strapi-Content-Type.md
- Clear next steps for user onboarding and account setup
- Brand-consistent design elements and color scheme

### Monitoring and Analytics
- **Campaign Performance**: Track email open rates, click-through rates, and conversion metrics
- **Contact Engagement**: Monitor which users engage with welcome emails and follow-up accordingly
- **A/B Testing**: Optional testing of subject lines, send times, and content variations
- **Integration Health**: Verify contact provisioning continues working correctly with campaign active

## Success Criteria
- Welcome campaign successfully created and published in Mautic interface
- Test emails delivered successfully with proper personalization
- Campaign automatically triggers for new user registrations from Better Auth
- Email templates render correctly across major email clients
- All dynamic variables populate with accurate contact data
- Campaign performance metrics are trackable in Mautic dashboard
- Integration maintains compatibility with existing contact provisioning workflow

## Implementation Guide

All steps must be performed through the Mautic Web UI. Access Mautic at `http://localhost:8080` (development) with your admin credentials.

### Step 1: Create "New Authenticated Users" Segment

A segment in Mautic is a dynamic group of contacts that match specific criteria. This segment will automatically include all users who have completed authentication with full profile information.

**Instructions**:

1. Navigate to **Segments** in the main menu (left sidebar)
2. Click **New** button (top right)
3. Configure segment details:

**Segment Configuration**:
- **Name**: `New Authenticated Users`
- **Alias**: `new-authenticated-users` (auto-generated)
- **Description**: `Teachers who have registered and provided their full name and email`
- **Published**: ✅ Yes
- **Public**: ❌ No (internal segment)

**Filters** (Click "Filters" tab):

Add the following filters to identify authenticated users:

**Filter 1: First Name exists**
- Field: `First Name`
- Condition: `is not empty`

Click "Add Filter" and add:

**Filter 2: Last Name exists**
- Field: `Last Name`
- Condition: `is not empty`

Click "Add Filter" and add:

**Filter 3: Email exists and is valid**
- Field: `Email`
- Condition: `is not empty`

Click "Add Filter" and add:

**Filter 4: Recent registration** (optional, to focus on new users)
- Field: `Date Added`
- Condition: `date greater than`
- Value: `-30 days` (contacts added in last 30 days)

**Filter Logic**: All conditions must match (AND logic)

4. Click **Save & Close**

**Verification**:
- The segment will show count of matching contacts
- Existing contacts from Better Auth integration should appear if they have all required fields

---

### Step 2: Create Welcome Email Template

Create the first email that will be sent to new users introducing Lupin Learn.

**Instructions**:

1. Navigate to **Channels** → **Emails** in the main menu
2. Click **New** button (top right)
3. Select **Template Email** (not Segment Email)

**Email Configuration**:

**Details Tab**:
- **Name**: `Welcome to Lupin Learn - First Email`
- **Subject**: `Welcome to Lupin Learn, {contactfield=firstname}! Save 10 Hours Per Week 🎓`
- **Internal Name**: `welcome-email-01`
- **Email Type**: Template
- **Published**: ✅ Yes
- **Send to Lists/Segments**: (Leave empty for now, campaign will handle this)

**Content Tab**:

Click **Builder** and select **Code Mode** (or use the visual builder):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Lupin Learn</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">

                <!-- Email Content Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                                Lupin Learn
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                                AI Tools to Save Time for Teachers
                            </p>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                Welcome, {contactfield=firstname}! 👋
                            </h2>

                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Thank you for joining Lupin Learn! We're excited to help you reclaim up to <strong>10 hours per week</strong> by automating repetitive teaching tasks.
                            </p>

                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                As a teacher, you have more important things to do than grade papers and create lesson plans from scratch. That's where we come in.
                            </p>
                        </td>
                    </tr>

                    <!-- Key Features -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                                🚀 Get Started with These Popular AI Tools:
                            </h3>

                            <!-- Feature 1 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    ✏️ Auto Grader
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Upload student submissions and receive scored evaluations with constructive feedback in minutes.
                                </p>
                            </div>

                            <!-- Feature 2 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    📚 Lesson Producer
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Generate curriculum-aligned lesson plans with objectives, activities, and assessments instantly.
                                </p>
                            </div>

                            <!-- Feature 3 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    🤖 Student Chatbot
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Provide 24/7 AI-powered support to answer student questions and reduce repetitive inquiries.
                                </p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; font-style: italic;">
                                Plus 37+ more AI tools to explore!
                            </p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="{webview_url}/app/tools" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                Explore AI Tools →
                            </a>

                            <p style="margin: 16px 0 0 0; color: #718096; font-size: 14px;">
                                Or visit your <a href="{webview_url}/account" style="color: #667eea; text-decoration: underline;">account dashboard</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Support Section -->
                    <tr>
                        <td style="padding: 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                Need Help Getting Started?
                            </h4>
                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                                We're here to help you make the most of Lupin Learn:
                            </p>
                            <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                <li><a href="{webview_url}/docs" style="color: #667eea; text-decoration: underline;">Browse Documentation</a></li>
                                <li><a href="{webview_url}/tutorials" style="color: #667eea; text-decoration: underline;">Watch Video Tutorials</a></li>
                                <li><a href="mailto:support@lupinlearn.com" style="color: #667eea; text-decoration: underline;">Contact Support</a></li>
                            </ul>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px 0; color: #718096; font-size: 14px;">
                                <strong>Lupin Learn</strong> - AI Tools to Save Time for Teachers
                            </p>
                            <p style="margin: 0 0 12px 0; color: #a0aec0; font-size: 12px;">
                                © 2025 Lupin Learn. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="{webview_url}/privacy" style="color: #a0aec0; text-decoration: underline;">Privacy Policy</a> ·
                                <a href="{webview_url}/terms" style="color: #a0aec0; text-decoration: underline;">Terms of Service</a> ·
                                <a href="{unsubscribe_url}" style="color: #a0aec0; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
```

**Key Features of Email**:
- ✅ Personalizes with `{contactfield=firstname}`
- ✅ Highlights top 3 AI tools from PRD (Auto Grader, Lesson Producer, Chatbot)
- ✅ Clear call-to-action to explore tools
- ✅ Mentions "40+ AI tools" as per PRD
- ✅ Responsive design works on mobile and desktop
- ✅ Professional gradient branding
- ✅ Includes required unsubscribe link

4. Click **Save & Close**

**Note**: Replace `{webview_url}` with your actual domain (e.g., `https://lupinlearn.com` or `http://localhost:5173` for development).

---

### Step 3: Create Welcome Campaign

Now tie everything together with a campaign that automatically sends the welcome email to new authenticated users.

**Instructions**:

1. Navigate to **Campaigns** in the main menu
2. Click **New** button (top right)

**Campaign Configuration**:

**Details Tab**:
- **Name**: `Welcome Campaign - New Authenticated Users`
- **Description**: `Automatically sends welcome email to teachers who complete registration with full profile`
- **Published**: ✅ Yes
- **Allow contacts to restart this campaign**: ❌ No (send once only)

**Campaign Builder** (Click "Launch Campaign Builder"):

The campaign builder is a visual workflow editor. Build the following flow:

#### Campaign Flow Structure:

```
[Contact added to Segment: New Authenticated Users]
            ↓
    [Wait 5 minutes]
            ↓
  [Send Email: Welcome to Lupin Learn]
            ↓
         [END]
```

#### Building the Flow:

**1. Add Segment Source**:
- Drag **"Contact Sources"** → **"Segments"** to canvas
- Configure:
  - **Label**: `New Authenticated Users Join`
  - **Segment**: Select `New Authenticated Users` (created in Step 1)
- Click **Save**

**2. Add Wait Action** (optional, recommended):
- Drag **"Actions"** → **"Wait"** below the segment source
- Connect segment source to wait action (drag connector)
- Configure:
  - **Wait Time**: `5 minutes`
  - **Reason**: Allows time for user to explore before receiving email
- Click **Save**

**3. Add Send Email Action**:
- Drag **"Actions"** → **"Send Email"** below wait action
- Connect wait action to send email
- Configure:
  - **Email**: Select `Welcome to Lupin Learn - First Email` (created in Step 2)
  - **Send to Contact**: ✅ Yes
- Click **Save**

**4. Connect to End**:
- Ensure the send email action connects to the campaign end point

4. Click **Close Builder**
5. Click **Save & Close**

**Campaign will now**:
- Monitor the "New Authenticated Users" segment
- When a new contact enters the segment (via Better Auth provisioning)
- Wait 5 minutes
- Send the welcome email automatically

---

### Step 4: Testing the Campaign

Before relying on the campaign, test that it works correctly.

**Test Method 1: Manual Test Email**

1. Go to **Channels** → **Emails**
2. Find **Welcome to Lupin Learn - First Email**
3. Click the email name to open it
4. Click **Send Example** button (top right)
5. Enter your email address
6. Verify email:
   - Personalizations work (check {contactfield=firstname} replaced correctly)
   - Links work correctly
   - Design renders properly
   - No broken images

**Test Method 2: Live Test with Campaign**

1. Create a test user via Better Auth registration:
   - Provide first name, last name, and email
   - Complete authentication
2. Verify contact appears in Mautic:
   - Go to **Contacts** → search for test email
   - Verify contact has firstname, lastname, email populated
3. Check segment membership:
   - Go to **Segments** → **New Authenticated Users**
   - Verify test contact appears in segment
4. Wait 5 minutes and check email:
   - Test email inbox should receive welcome email
   - Verify all personalization and links work

**Test Method 3: Campaign Statistics**

1. Navigate to **Campaigns** → **Welcome Campaign - New Authenticated Users**
2. Click campaign name to view details
3. Check **Statistics** tab:
   - **Total Contacts**: Should show contacts entering segment
   - **Emails Sent**: Should increment as emails go out
   - **Email Opens/Clicks**: Track engagement

---

### Step 5: Monitor Campaign Performance

After campaign is live, monitor key metrics to optimize performance.

**Metrics to Track**:

1. **Email Delivery Rate**:
   - Go to campaign statistics
   - Check **Sent** vs **Bounced** emails
   - Target: >95% delivery rate

2. **Open Rate**:
   - Check **Opened** percentage
   - Target: >20% for welcome emails
   - If low, test different subject lines

3. **Click-Through Rate**:
   - Check **Clicked** percentage
   - Target: >10% CTR on "Explore AI Tools" button
   - If low, optimize CTA placement/copy

4. **Segment Growth**:
   - Monitor **New Authenticated Users** segment size
   - Should correlate with Better Auth registrations
   - If not growing, check integration (MA02)

**Optimization Tips**:
- A/B test subject lines to improve open rates
- Adjust wait time if users complain about email timing
- Update email content based on which tools users explore first
- Add follow-up emails for users who don't click CTA

---

## Success Criteria

✅ **Segment Created**:
- "New Authenticated Users" segment exists with proper filters
- Segment automatically includes contacts with firstname, lastname, email

✅ **Email Created**:
- "Welcome to Lupin Learn - First Email" template exists
- Email includes personalization, key features, and clear CTA
- All links work correctly (test via send example)

✅ **Campaign Active**:
- "Welcome Campaign - New Authenticated Users" published and running
- Campaign triggers automatically when contacts enter segment
- Email delivery rate >95%

✅ **Integration Working**:
- New users from Better Auth appear in Mautic contacts
- Contacts with full profile enter segment automatically
- Welcome email sent within 5 minutes of segment entry

✅ **Performance Baseline**:
- Open rate tracked (target >20%)
- Click-through rate tracked (target >10%)
- Campaign statistics accessible for ongoing optimization

---

## Troubleshooting

### Issue: Contacts not entering segment
**Solution**:
- Verify contact has all required fields: firstname, lastname, email
- Check segment filters match field names exactly
- Rebuild segment (click "Rebuild Segment" button)

### Issue: Campaign not sending emails
**Solution**:
- Verify campaign is Published
- Check campaign builder connections are complete
- Ensure email is Published
- Check Mautic cron jobs are running (MA01)

### Issue: Personalization not working
**Solution**:
- Verify field names match: `{contactfield=firstname}` not `{contactfield=firstName}`
- Test with contacts that have fields populated
- Check field mapping in Better Auth integration (MA02)

### Issue: Low open rates
**Solution**:
- Test different subject line variations
- Verify sender email domain has proper SPF/DKIM
- Check emails not going to spam folder
- Send test to multiple email providers (Gmail, Outlook, etc.)

---

## Next Steps

After successfully implementing the welcome campaign:

1. **Add Follow-up Emails**: Create Day 3, Day 7 follow-ups for users who haven't engaged
2. **Segment Further**: Create segments for users who clicked specific tools
3. **Localization**: Translate email content for multiple languages (AI02-Content-Localization-Workflow.md)
4. **A/B Testing**: Test variations of subject lines and content
5. **Tool-Specific Campaigns**: Create campaigns for specific AI tools (Auto Grader, Lesson Producer, etc.)

---

## Additional Context for AI Assistant

This implementation establishes the foundation for marketing automation by creating the first automated email campaign. Key points:

1. **Mautic UI Only**: All steps performed through web interface at `http://localhost:8080`
2. **Integration Dependent**: Relies on Better Auth contact provisioning (MA02-Mautic-API-Auth.md)
3. **Product-Focused**: Email content aligned with Lupin Learn PRD value proposition
4. **Scalable Template**: Campaign structure can be replicated for other user journeys

The campaign should serve as a template for future marketing automation while providing immediate value through professional user onboarding that introduces teachers to Lupin Learn's time-saving AI tools.