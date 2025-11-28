# MA04-Mautic-Campaign-Automation.md

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
Automate marketing campaign triggers by using Mautic APIs to add users to segments and campaigns when signup or subscription plan changes occur in the SvelteKit application. This enables real-time marketing automation based on user lifecycle events.

**Business Value**: Ensures users receive appropriate marketing communications based on their subscription tier and lifecycle stage, improving engagement and conversion rates through automated, targeted campaigns.

**Feature Type**: Technical Integration

## Requirements

### Functional Requirements
- **User Signup Automation**: Add new users to Mautic "New Users" segment and trigger welcome campaign upon registration
- **Plan Change Handling**: Move users between subscription tier segments (Free, Pro, Enterprise) when plans change
- **Contact Synchronization**: Update Mautic contact fields with latest user data including subscription status
- **Campaign Assignment**: Automatically assign users to appropriate campaigns based on their segment
- **Error Recovery**: Handle Mautic API failures gracefully with retry logic and fallback mechanisms

### User Stories
- As a new user, I want to receive welcome emails immediately after signing up
- As a user upgrading to Pro, I want to receive Pro tier onboarding emails
- As a user downgrading plans, I want to receive appropriate retention campaigns
- As a marketing team, we want all user segments updated automatically based on subscription changes

### Integration Points
- **User Registration**: Hook into S02-Signup-Form.md signup completion events
- **Authentication Events**: Connect with Better Auth from AU02-BetterAuth-Init.md
- **Subscription Changes**: Listen to events from ST04-Stripe-Webhooks.md and LS04-LemonSqueezy-Webhooks.md
- **Mautic API**: Use credentials from MA02-Mautic-API-Auth.md
- **Contact Creation**: Build on MA05-Mautic-Frontend-Connect.md contact provisioning

### Data Requirements
- Map user subscription tiers to Mautic segments
- Track Mautic contact IDs alongside user records
- Store campaign assignment status for each user
- Log API call results for debugging and audit

### Security Considerations
- Never expose Mautic API credentials to client-side code
- Validate all user data before sending to Mautic
- Implement rate limiting to prevent API abuse
- Log all Mautic API interactions for audit trails
- Use server-side only API calls

### Performance Requirements
- Process user events within 5 seconds
- Batch API calls when possible to reduce overhead
- Implement exponential backoff for failed API calls
- Cache Mautic segment and campaign IDs
- Handle up to 100 concurrent user events

## Technical Specifications

### Dependencies
- Mautic API client from MA02-Mautic-API-Auth.md
- User authentication from AU02-BetterAuth-Init.md
- Subscription webhook handlers from ST04/LS04
- Environment variables for Mautic configuration

### Implementation Architecture

#### Event Handlers
```typescript
// src/lib/mautic/automation.ts
import { mauticClient } from '$lib/mautic/client';

export async function handleUserSignup(user: User) {
  try {
    // Add user to "New Users" segment
    await mauticClient.segments.addContact(
      MAUTIC_NEW_USERS_SEGMENT_ID,
      user.mauticContactId
    );
    
    // Trigger welcome campaign
    await mauticClient.campaigns.addContact(
      MAUTIC_WELCOME_CAMPAIGN_ID,
      user.mauticContactId
    );
    
    console.log(`Added user ${user.id} to welcome campaign`);
  } catch (error) {
    console.error('Failed to process signup in Mautic:', error);
    // Queue for retry
    await queueMauticEvent('user_signup', user);
  }
}

export async function handlePlanChange(
  user: User,
  oldTier: string,
  newTier: string
) {
  try {
    // Remove from old tier segment
    if (oldTier) {
      const oldSegmentId = getTierSegmentId(oldTier);
      await mauticClient.segments.removeContact(
        oldSegmentId,
        user.mauticContactId
      );
    }
    
    // Add to new tier segment
    const newSegmentId = getTierSegmentId(newTier);
    await mauticClient.segments.addContact(
      newSegmentId,
      user.mauticContactId
    );
    
    // Trigger tier-specific campaign
    const campaignId = getTierCampaignId(newTier);
    if (campaignId) {
      await mauticClient.campaigns.addContact(
        campaignId,
        user.mauticContactId
      );
    }
    
    // Update contact fields
    await mauticClient.contacts.edit(user.mauticContactId, {
      subscription_tier: newTier,
      subscription_updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to process plan change in Mautic:', error);
    await queueMauticEvent('plan_change', { user, oldTier, newTier });
  }
}
```

#### Integration with Signup Flow
```typescript
// src/routes/signup/+page.server.ts
import { handleUserSignup } from '$lib/mautic/automation';

export const actions = {
  default: async ({ request, locals }) => {
    // ... existing signup logic ...
    
    // After successful user creation
    if (newUser) {
      // Create Mautic contact (from MA05)
      const mauticContact = await createMauticContact(newUser);
      
      // Trigger automation
      await handleUserSignup({
        ...newUser,
        mauticContactId: mauticContact.id
      });
    }
    
    return { success: true };
  }
};
```

#### Integration with Subscription Webhooks
```typescript
// src/routes/api/stripe/webhook/+server.ts
import { handlePlanChange } from '$lib/mautic/automation';

export const POST: RequestHandler = async ({ request }) => {
  // ... existing webhook processing ...
  
  switch (event.type) {
    case 'customer.subscription.updated':
      const user = await getUserByStripeCustomerId(customerId);
      const oldTier = user.subscriptionTier;
      const newTier = getT ierFromSubscription(subscription);
      
      // Update user record
      await updateUserSubscription(user.id, newTier);
      
      // Trigger Mautic automation
      await handlePlanChange(user, oldTier, newTier);
      break;
  }
  
  return new Response('OK', { status: 200 });
};
```

### Segment and Campaign Mapping
```typescript
// src/lib/mautic/config.ts
export const MAUTIC_SEGMENTS = {
  NEW_USERS: process.env.MAUTIC_NEW_USERS_SEGMENT_ID,
  FREE_TIER: process.env.MAUTIC_FREE_TIER_SEGMENT_ID,
  PRO_TIER: process.env.MAUTIC_PRO_TIER_SEGMENT_ID,
  ENTERPRISE_TIER: process.env.MAUTIC_ENTERPRISE_TIER_SEGMENT_ID,
  CHURNED: process.env.MAUTIC_CHURNED_SEGMENT_ID
};

export const MAUTIC_CAMPAIGNS = {
  WELCOME: process.env.MAUTIC_WELCOME_CAMPAIGN_ID,
  PRO_ONBOARDING: process.env.MAUTIC_PRO_ONBOARDING_CAMPAIGN_ID,
  ENTERPRISE_ONBOARDING: process.env.MAUTIC_ENTERPRISE_ONBOARDING_CAMPAIGN_ID,
  WINBACK: process.env.MAUTIC_WINBACK_CAMPAIGN_ID
};
```

### Database Schema
```sql
-- Add Mautic tracking to users table
ALTER TABLE users ADD COLUMN mautic_contact_id INT NULL;
ALTER TABLE users ADD COLUMN mautic_segments JSON NULL;
ALTER TABLE users ADD COLUMN mautic_campaigns JSON NULL;
ALTER TABLE users ADD COLUMN mautic_last_synced_at TIMESTAMP NULL;

-- Queue for failed Mautic operations
CREATE TABLE mautic_event_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  payload JSON NOT NULL,
  attempts INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
);
```

### Environment Variables
```bash
# Mautic Segment IDs
MAUTIC_NEW_USERS_SEGMENT_ID=1
MAUTIC_FREE_TIER_SEGMENT_ID=2
MAUTIC_PRO_TIER_SEGMENT_ID=3
MAUTIC_ENTERPRISE_TIER_SEGMENT_ID=4
MAUTIC_CHURNED_SEGMENT_ID=5

# Mautic Campaign IDs
MAUTIC_WELCOME_CAMPAIGN_ID=1
MAUTIC_PRO_ONBOARDING_CAMPAIGN_ID=2
MAUTIC_ENTERPRISE_ONBOARDING_CAMPAIGN_ID=3
MAUTIC_WINBACK_CAMPAIGN_ID=4
```

### Error Handling and Retry Logic
```typescript
// src/lib/mautic/queue.ts
export async function processMauticQueue() {
  const pendingEvents = await db.mauticEventQueue.findMany({
    where: { status: 'pending', attempts: { lt: 3 } },
    orderBy: { created_at: 'asc' },
    take: 10
  });
  
  for (const event of pendingEvents) {
    try {
      await db.mauticEventQueue.update({
        where: { id: event.id },
        data: { status: 'processing' }
      });
      
      // Process based on event type
      switch (event.event_type) {
        case 'user_signup':
          await handleUserSignup(event.payload);
          break;
        case 'plan_change':
          await handlePlanChange(
            event.payload.user,
            event.payload.oldTier,
            event.payload.newTier
          );
          break;
      }
      
      await db.mauticEventQueue.update({
        where: { id: event.id },
        data: { 
          status: 'completed',
          processed_at: new Date()
        }
      });
      
    } catch (error) {
      await db.mauticEventQueue.update({
        where: { id: event.id },
        data: { 
          status: 'pending',
          attempts: { increment: 1 },
          error_message: error.message
        }
      });
    }
  }
}

// Run queue processor every minute
setInterval(processMauticQueue, 60000);
```

## Mautic Configuration Requirements

### Segments to Create in Mautic
1. **New Users**: All newly registered users
2. **Free Tier**: Users on free plan
3. **Pro Tier**: Users on pro subscription
4. **Enterprise Tier**: Users on enterprise subscription
5. **Churned**: Users who cancelled subscription

### Campaigns to Create in Mautic
1. **Welcome Campaign**: 5-email onboarding sequence for new users
2. **Pro Onboarding**: Pro-specific feature tutorials
3. **Enterprise Onboarding**: Enterprise feature walkthrough
4. **Win-back Campaign**: Re-engagement for churned users

### Custom Contact Fields in Mautic
- `subscription_tier`: Current subscription level
- `subscription_status`: Active/Cancelled/Past Due
- `signup_date`: User registration date
- `last_login`: Most recent login timestamp
- `lifetime_value`: Total payments received

## Testing Checklist
- [ ] User signup triggers welcome campaign
- [ ] Free to Pro upgrade moves user to Pro segment
- [ ] Pro to Enterprise upgrade triggers appropriate campaign
- [ ] Downgrade removes user from higher tier segments
- [ ] Cancellation adds user to churned segment
- [ ] Failed API calls are queued and retried
- [ ] Mautic contact fields update correctly

## Additional Context

### Benefits of This Approach
- **Real-time Updates**: User segments update immediately upon plan changes
- **Reliability**: Retry queue ensures no events are lost
- **Scalability**: Batch processing supports high volume
- **Maintainability**: Clear separation between app logic and marketing automation

### Future Enhancements
- Add support for custom user events (feature usage, milestones)
- Implement A/B testing for campaign assignments
- Add analytics tracking for campaign performance
- Support for dynamic segment creation based on user behavior

### Prerequisites
- MA01-Mautic-Container-Setup.md - Mautic instance running
- MA02-Mautic-API-Auth.md - API credentials configured
- MA03-Mautic-Create-Campaign.md - Campaigns created in Mautic
- MA05-Mautic-Frontend-Connect.md - Contact provisioning system
- MA06-Create-First-Email.md - Email templates configured