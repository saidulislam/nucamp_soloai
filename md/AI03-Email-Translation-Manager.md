# AI03-Email-Translation-Manager.md

## Overview
Create a comprehensive email translation management interface in the SvelteKit application that allows marketing teams to view all Mautic emails, see available translations, and generate missing language versions using the translation service from MA07-Email-Translations-Route.md.

**Business Value**: Enables marketing teams to efficiently manage multilingual email campaigns, ensuring all customers receive communications in their preferred language while maintaining brand consistency.

**Feature Type**: User-Facing Feature with API Integration

## Requirements

### User Stories
- As a marketing manager, I want to see all Mautic emails in one dashboard with their translation status
- As a content creator, I want to quickly generate missing translations for any email
- As a team lead, I want to track which emails need translation and prioritize them
- As a marketer, I want to preview translated emails before they go live

### UI/UX Requirements

#### Email Translation Dashboard
- **Route**: `/admin/emails/translations`
- **Layout**: Responsive data table with filtering and sorting
- **Access Control**: Restricted to authenticated admin/marketing users

#### List View Components
```svelte
<!-- src/routes/admin/emails/translations/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import EmailRow from './EmailRow.svelte';
  import TranslationModal from './TranslationModal.svelte';
  
  let emails = [];
  let loading = true;
  let selectedEmail = null;
  let filterStatus = 'all'; // all, translated, partial, untranslated
  let searchQuery = '';
  
  onMount(async () => {
    await fetchEmails();
  });
  
  async function fetchEmails() {
    const response = await fetch('/api/mautic/emails');
    emails = await response.json();
    loading = false;
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Email Translation Manager</h1>
  
  <!-- Filters and Search -->
  <div class="flex gap-4 mb-6">
    <input 
      type="search" 
      bind:value={searchQuery}
      placeholder="Search emails..."
      class="input input-bordered w-full max-w-xs"
    />
    
    <select bind:value={filterStatus} class="select select-bordered">
      <option value="all">All Emails</option>
      <option value="translated">Fully Translated</option>
      <option value="partial">Partially Translated</option>
      <option value="untranslated">Needs Translation</option>
    </select>
    
    <button on:click={fetchEmails} class="btn btn-secondary">
      Refresh
    </button>
  </div>
  
  <!-- Email List Table -->
  <div class="overflow-x-auto">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th>Email Name</th>
          <th>Subject</th>
          <th>Campaign</th>
          <th>Languages</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredEmails as email}
          <EmailRow 
            {email} 
            on:translate={() => openTranslationModal(email)}
            on:preview={(e) => previewEmail(e.detail)}
          />
        {/each}
      </tbody>
    </table>
  </div>
  
  <!-- Translation Modal -->
  {#if selectedEmail}
    <TranslationModal 
      email={selectedEmail}
      on:close={() => selectedEmail = null}
      on:success={handleTranslationSuccess}
    />
  {/if}
</div>
```

#### Email Row Component
```svelte
<!-- src/routes/admin/emails/translations/EmailRow.svelte -->
<script lang="ts">
  export let email;
  
  const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ar', 'hi', 'ru', 'zh', 'fi', 'ur'];
  
  function getTranslationStatus() {
    const translated = email.translations || [];
    if (translated.length === 0) return 'untranslated';
    if (translated.length === supportedLanguages.length - 1) return 'complete';
    return 'partial';
  }
  
  function getMissingLanguages() {
    const translated = email.translations?.map(t => t.language) || ['en'];
    return supportedLanguages.filter(lang => !translated.includes(lang));
  }
</script>

<tr>
  <td class="font-medium">{email.name}</td>
  <td class="text-sm text-gray-600">{email.subject}</td>
  <td>{email.campaign?.name || 'None'}</td>
  <td>
    <div class="flex flex-wrap gap-1">
      {#each supportedLanguages as lang}
        <span 
          class="badge {email.translations?.find(t => t.language === lang) ? 'badge-success' : 'badge-ghost'}"
          title="{lang.toUpperCase()}"
        >
          {lang}
        </span>
      {/each}
    </div>
  </td>
  <td>
    <span class="badge badge-{getTranslationStatus() === 'complete' ? 'success' : getTranslationStatus() === 'partial' ? 'warning' : 'error'}">
      {getTranslationStatus()}
    </span>
  </td>
  <td>
    <div class="btn-group">
      <button 
        class="btn btn-sm btn-primary"
        on:click={() => dispatch('translate', email)}
        disabled={getTranslationStatus() === 'complete'}
      >
        Translate
      </button>
      <button 
        class="btn btn-sm btn-ghost"
        on:click={() => dispatch('preview', email)}
      >
        Preview
      </button>
    </div>
  </td>
</tr>
```

#### Translation Modal
```svelte
<!-- src/routes/admin/emails/translations/TranslationModal.svelte -->
<script lang="ts">
  export let email;
  
  let selectedLanguages = [];
  let translating = false;
  let progress = 0;
  let results = [];
  
  async function startTranslation() {
    translating = true;
    progress = 0;
    
    const response = await fetch('/api/mautic/emails/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailId: email.id,
        locales: selectedLanguages,
        linkToParent: true
      })
    });
    
    const result = await response.json();
    results = result.translations;
    translating = false;
  }
</script>

<div class="modal modal-open">
  <div class="modal-box max-w-2xl">
    <h3 class="font-bold text-lg mb-4">Translate Email: {email.name}</h3>
    
    {#if !translating && results.length === 0}
      <!-- Language Selection -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Select target languages:</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          {#each getMissingLanguages() as lang}
            <label class="cursor-pointer label">
              <input 
                type="checkbox" 
                class="checkbox checkbox-primary"
                value={lang}
                bind:group={selectedLanguages}
              />
              <span class="label-text ml-2">{getLanguageName(lang)}</span>
            </label>
          {/each}
        </div>
      </div>
      
      <div class="modal-action">
        <button class="btn" on:click={() => dispatch('close')}>Cancel</button>
        <button 
          class="btn btn-primary"
          on:click={startTranslation}
          disabled={selectedLanguages.length === 0}
        >
          Translate to {selectedLanguages.length} Language(s)
        </button>
      </div>
    {/if}
    
    {#if translating}
      <!-- Progress Indicator -->
      <div class="text-center py-8">
        <div class="radial-progress text-primary" style="--value:{progress};">
          {progress}%
        </div>
        <p class="mt-4">Translating email content...</p>
      </div>
    {/if}
    
    {#if results.length > 0}
      <!-- Results -->
      <div class="space-y-2">
        <h4 class="font-semibold">Translation Results:</h4>
        {#each results as result}
          <div class="alert {result.status === 'created' ? 'alert-success' : result.status === 'error' ? 'alert-error' : 'alert-warning'}">
            <div>
              <h5 class="font-bold">{result.locale.toUpperCase()}</h5>
              <p class="text-sm">
                {result.status === 'created' ? 'Successfully translated' : 
                 result.status === 'skipped' ? 'Already exists' : 
                 result.message}
              </p>
            </div>
          </div>
        {/each}
      </div>
      
      <div class="modal-action">
        <button class="btn btn-primary" on:click={handleClose}>Done</button>
      </div>
    {/if}
  </div>
</div>
```

### Functional Requirements

#### Email List Management
- **Fetch Emails**: Retrieve all emails from Mautic via API
- **Translation Status**: Show which languages are available for each email
- **Filtering**: Filter by translation status (complete/partial/none)
- **Search**: Search emails by name, subject, or campaign
- **Sorting**: Sort by name, date, or translation status

#### Translation Workflow
- **Language Detection**: Identify missing translations for each email
- **Batch Translation**: Translate to multiple languages at once
- **Progress Tracking**: Show real-time progress during translation
- **Error Handling**: Display clear error messages if translation fails
- **Success Confirmation**: Show which translations succeeded/failed

#### Preview Functionality
- **Multi-language Preview**: View email in any available language
- **Side-by-side Comparison**: Compare original with translations
- **Personalization Preview**: Show how tokens render in different languages

### API Integration

#### Backend Endpoints

##### Get All Emails
```typescript
// src/routes/api/mautic/emails/+server.ts
import { json } from '@sveltejs/kit';
import { getMauticClient } from '$lib/mautic/client';

export async function GET({ locals }) {
  // Verify admin access
  const session = await locals.auth();
  if (!session?.user?.role === 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const mautic = getMauticClient();
  
  try {
    // Fetch all emails from Mautic
    const emails = await mautic.emails.getList({
      limit: 1000,
      orderBy: 'dateModified',
      orderByDir: 'DESC'
    });
    
    // For each email, check for translations
    const emailsWithTranslations = await Promise.all(
      emails.emails.map(async (email) => {
        // Find child emails (translations)
        const translations = await mautic.emails.getList({
          search: `translationParent:${email.id}`
        });
        
        return {
          id: email.id,
          name: email.name,
          subject: email.subject,
          language: email.language || 'en',
          campaign: email.category,
          dateCreated: email.dateAdded,
          dateModified: email.dateModified,
          translations: translations.emails.map(t => ({
            id: t.id,
            language: t.language,
            subject: t.subject
          }))
        };
      })
    );
    
    return json(emailsWithTranslations);
    
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
```

##### Translation Endpoint (from MA07)
```typescript
// Uses existing endpoint from MA07-Email-Translations-Route.md
// POST /api/mautic/emails/translate
```

##### Preview Email
```typescript
// src/routes/api/mautic/emails/[id]/preview/+server.ts
export async function GET({ params, url, locals }) {
  const session = await locals.auth();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  const language = url.searchParams.get('lang') || 'en';
  
  const mautic = getMauticClient();
  
  try {
    const email = await mautic.emails.get(id);
    
    // If requesting translation, find the translated version
    if (language !== 'en') {
      const translations = await mautic.emails.getList({
        search: `translationParent:${id} AND language:${language}`
      });
      
      if (translations.total > 0) {
        const translatedEmail = await mautic.emails.get(translations.emails[0].id);
        return json(translatedEmail);
      }
    }
    
    return json(email);
    
  } catch (error) {
    return json({ error: 'Email not found' }, { status: 404 });
  }
}
```

### Data Requirements

#### Email Status Tracking
- Track which emails have been translated
- Store translation timestamps
- Monitor translation quality metrics
- Log translation errors and retries

#### User Permissions
- Admin users can translate any email
- Marketing users can translate their campaign emails
- Read-only users can view but not translate

### Security Considerations
- Authenticate all API requests
- Validate user permissions for translation
- Rate limit translation requests
- Audit log all translation activities
- Sanitize email content before display

### Performance Requirements
- Load email list within 2 seconds
- Start translation within 1 second of request
- Show progress updates every 5 seconds
- Cache email list for 5 minutes
- Support 50+ concurrent users

## Technical Specifications

### Dependencies
- Mautic API client from MA02-Mautic-API-Auth.md
- Translation service from MA07-Email-Translations-Route.md
- Authentication from Better Auth
- UI components from DaisyUI/Tailwind

### State Management
```typescript
// src/lib/stores/emails.ts
import { writable, derived } from 'svelte/store';

export const emails = writable([]);
export const loading = writable(false);
export const filter = writable('all');
export const searchQuery = writable('');

export const filteredEmails = derived(
  [emails, filter, searchQuery],
  ([$emails, $filter, $search]) => {
    let filtered = $emails;
    
    // Apply status filter
    if ($filter !== 'all') {
      filtered = filtered.filter(email => {
        const status = getTranslationStatus(email);
        return status === $filter;
      });
    }
    
    // Apply search
    if ($search) {
      filtered = filtered.filter(email => 
        email.name.toLowerCase().includes($search.toLowerCase()) ||
        email.subject.toLowerCase().includes($search.toLowerCase())
      );
    }
    
    return filtered;
  }
);
```

### Caching Strategy
- Cache email list in sessionStorage
- Invalidate cache on translation success
- Refresh cache every 5 minutes
- Show stale data with refresh option

## Testing Requirements

### Unit Tests
- Test email filtering logic
- Test translation status calculation
- Test language detection
- Test error handling

### Integration Tests
- Test Mautic API integration
- Test translation service calls
- Test progress tracking
- Test cache invalidation

### E2E Tests
- Test complete translation workflow
- Test filtering and searching
- Test preview functionality
- Test error scenarios

## Additional Context

### Benefits of This Approach
- **Centralized Management**: All email translations in one place
- **Efficiency**: Bulk translate multiple languages at once
- **Visibility**: Clear overview of translation coverage
- **Quality Control**: Preview before sending
- **Automation**: Reduces manual translation work

### Future Enhancements
- Add translation quality scoring
- Implement A/B testing for translations
- Add glossary management for consistent terms
- Support for email template variables
- Integration with translation memory
- Automated translation scheduling

### Prerequisites
- MA02-Mautic-API-Auth.md - Mautic API access
- MA07-Email-Translations-Route.md - Translation service
- AI01-OpenAI-API-Setup.md - OpenAI configuration
- AU05-Protect-Routes.md - Route protection

### User Training Requirements
- How to identify emails needing translation
- Understanding translation status indicators
- Using bulk translation features
- Reviewing translation quality
- Managing language preferences