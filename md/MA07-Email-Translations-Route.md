# MA07-Email-Translations-Route.md

## Overview
Create a SvelteKit API endpoint that generates localized versions of Mautic emails using OpenAI translation and Mautic APIs. The endpoint accepts a Mautic email ID and target languages, extracts translatable content from the email's HTML, translates it while preserving structure, and creates linked translated versions in Mautic.

**Implementation Reference**: This document is based on the Solo AI Reference project implementation at `src/routes/api/mautic/emails/[emailId]/translate/+server.ts`

**Feature Type**: API Endpoint

## Requirements

### Endpoint Specification
- **Path**: `/api/mautic/emails/[emailId]/translate`
- **Method**: POST
- **Authentication**: Basic Auth (MAUTIC_USERNAME / MAUTIC_PASSWORD)
- **Content-Type**: application/json

### Request Parameters

**URL Parameter**:
- `emailId` - ID of the source email in Mautic (from URL path)

**Body Parameters**:
```typescript
interface TranslateEmailRequest {
  languages?: string[];   // Optional array of target language codes (e.g., ['es', 'fr', 'de'])
                         // If omitted, translates to all configured languages except English
}
```

**Authentication Header**:
```
Authorization: Basic {base64(MAUTIC_USERNAME:MAUTIC_PASSWORD)}
```

### Response Format
```typescript
interface TranslateEmailResponse {
  // Array of created email objects with language information
  [
    {
      email: MauticEmail;  // Complete Mautic email object
      language: string;    // Language code (e.g., 'es', 'fr', 'de')
    },
    // ... more translations
  ]
}
```

**Note**: The endpoint returns the array of newly created translated emails directly. Each email is automatically linked to the parent email via Mautic's translation parent-child relationships. The linking is done using `templateTranslationParent` (for template emails) or `segmentTranslationParent` (for list emails), which Mautic internally maps to `translationParent`.

### Functional Requirements
- **Email Retrieval**: Fetch the source email from Mautic using its ID via Mautic service
- **Language Determination**: Filter target languages to exclude English and existing translations
- **Content Extraction**: Parse HTML to extract translatable text using Cheerio library
  - Extract text from semantic tags: `<title>`, `<p>`, `<a>`, `<span>`, `<h1-h6>`
  - Extract alt attributes from images and links
  - Find innermost content within nested elements
  - Clean up extracted data (remove empty strings, single punctuation, raw URLs, HTML entities)
- **Translation Processing**: Use OpenAI API to translate extracted content
  - Preserve HTML structure and tags
  - Maintain proper text direction (RTL for Arabic/Hebrew)
  - Keep personalization tokens intact (e.g., `{contactfield=firstname}`)
- **HTML Reconstruction**: Replace original text with translations while preserving structure
- **Email Creation**: Create new emails in Mautic with translated content
- **Parent Linking**: Automatically link via `templateTranslationParent` (for template emails) or `segmentTranslationParent` (for list emails) field during email creation
- **Duplicate Prevention**: Skip languages that already have translations

### Translation Fields

The implementation extracts and translates the following:

**HTML Content**:
- `<title>` tags
- `<p>` (paragraph) tags
- `<a>` (link) text content
- `<span>` tags
- `<h1>` through `<h6>` heading tags
- Alt attributes from `<img>` and `<a>` tags

**Content Processing**:
- Extracts innermost content from nested elements
- Removes HTML tags, empty strings, single punctuation
- Filters out raw URLs and Unicode word joiners
- Preserves Mautic personalization tokens
- Maintains HTML structure and attributes

### Mautic Integration Requirements
- Use Mautic REST API v3 for all operations
- Preserve email templates and styling
- Maintain personalization tokens (e.g., {contactfield=firstname})
- Keep tracking pixels and links intact
- Preserve email categories and segments

## Technical Specifications

### Dependencies

**Required npm Packages**:
- `cheerio` - HTML parsing and manipulation library
- `openai` - OpenAI API client for translation

**Project Dependencies**:
- Mautic service class from `$lib/services/mautic.ts` (MA02-Mautic-API-Auth.md)
- OpenAI service from `$lib/services/openai.ts` (AI01-OpenAI-API-Setup.md)
- Language configuration from Paraglide (PG02-Paraglide-Configure-Langs.md)

**Environment Variables**:
- `MAUTIC_USERNAME` - Basic auth username
- `MAUTIC_PASSWORD` - Basic auth password
- `OPENAI_API_KEY` - OpenAI API key for translation

### API Workflow
1. **Validate Request**
   - Verify email ID exists in Mautic
   - Validate locale codes against supported languages
   - Check user permissions

2. **Fetch Source Email**
   ```javascript
   GET /api/emails/{emailId}
   Authorization: Bearer {mautic_token}
   ```

3. **Extract Translatable Content**
   - Parse HTML/text content
   - Identify translatable strings
   - Preserve non-translatable elements (tokens, tracking)

4. **Translate Content**
   - Call translation service for each locale
   - Maintain formatting and structure
   - Handle special characters and HTML entities

5. **Create Translated Emails**
   ```javascript
   POST /api/emails/new
   Authorization: Bearer {mautic_token}
   Content-Type: application/json
   {
     "name": "{original_name} - {locale}",
     "subject": "{translated_subject}",
     "customHtml": "{translated_html}",
     "plainText": "{translated_text}",
     "language": "{locale}",
     "emailType": "template",
     "templateTranslationParent": {emailId}  // Use templateTranslationParent for template emails
                                              // or segmentTranslationParent for list emails
   }
   ```

   **Important**: Mautic uses different field names for translation parent linking:
   - `templateTranslationParent` for template emails (`emailType: "template"`)
   - `segmentTranslationParent` for list emails (`emailType: "list"`)

   These fields are internally mapped to `translationParent` by Mautic. The parent-child relationship is established during email creation - no separate linking step is required.

### Error Handling
- **API Rate Limiting**: Implement exponential backoff for Mautic API calls
- **Translation Failures**: Continue with other locales if one fails
- **Partial Success**: Return details of successful and failed translations
- **Validation Errors**: Return specific error messages for invalid inputs
- **Network Errors**: Implement retry logic with timeout

### Environment Variables
```bash
MAUTIC_BASE_URL=http://localhost:8080
MAUTIC_API_USERNAME=admin
MAUTIC_API_PASSWORD=password
OPENAI_API_KEY=sk-...
TRANSLATION_BATCH_SIZE=5
TRANSLATION_TIMEOUT_MS=30000
```

### Implementation Example

Based on the Solo AI Reference project implementation:

**File**: `src/routes/api/mautic/emails/[emailId]/translate/+server.ts`

```typescript
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAUTIC_PASSWORD, MAUTIC_USERNAME } from '$env/static/private';
import { translateEmail } from './helper';

export const POST: RequestHandler = async ({ request, params }) => {
  // Extract email ID from URL params
  const { emailId } = params;

  // Parse request body for language filter
  let languages = [];
  if (request.body) {
    const data = await request.json();
    if (data?.languages) {
      languages = data.languages;
    }
  }

  // Validate Basic Auth
  const token = request.headers.get('Authorization');
  const username = MAUTIC_USERNAME;
  const password = MAUTIC_PASSWORD;
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  if (token !== `Basic ${auth}`) {
    error(401, 'Access denied');
  }

  // Translate email to target languages
  const createdEmails = await translateEmail(parseInt(emailId), languages);

  return json(createdEmails);
};
```

**File**: `src/routes/api/mautic/emails/[emailId]/translate/helper.ts`

```typescript
import Mautic from '$lib/services/mautic';
import OpenAI from '$lib/services/openai';
import * as cheerio from 'cheerio';
import { availableLanguageTags } from '$lib/paraglide/runtime';

/**
 * Extract translatable content from HTML email
 */
function extractContentAndAlt(html: string): string[] {
  const $ = cheerio.load(html);
  const extractedContent: string[] = [];

  // Extract text from semantic tags
  const tags = ['title', 'p', 'a', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  tags.forEach(tag => {
    $(tag).each((_, element) => {
      // Find innermost content (no nested tags)
      const text = $(element).text().trim();
      if (text && !$(element).children().length) {
        extractedContent.push(text);
      }

      // Extract alt attributes
      const alt = $(element).attr('alt');
      if (alt) {
        extractedContent.push(alt);
      }
    });
  });

  return extractedContent;
}

/**
 * Clean up extracted data
 */
function cleanUpExtractedData(data: string[]): string[] {
  return data
    .filter(item => item.trim() !== '')           // Remove empty
    .filter(item => !/^[^\w\s]+$/.test(item))    // Remove single punctuation
    .filter(item => !item.match(/^https?:\/\//))  // Remove raw URLs
    .filter(item => item !== '\u200D');            // Remove Unicode word joiners
}

/**
 * Translate email to multiple languages
 */
export async function translateEmail(
  emailId: number,
  onlyLanguages: string[]
): Promise<Array<{ email: any; language: string }>> {

  const mauticClient = new Mautic();
  const openAIClient = new OpenAI();

  // 1. Fetch source email
  const sourceEmail = await mauticClient.getEmail(emailId);

  // 2. Determine target languages
  let targetLanguages = availableLanguageTags.filter(lang => lang !== 'en');

  // Filter out languages with existing translations
  if (sourceEmail.translationChildren?.length) {
    const existingLangs = sourceEmail.translationChildren.map(child => child.language);
    targetLanguages = targetLanguages.filter(lang => !existingLangs.includes(lang));
  }

  // Apply language filter if provided
  if (onlyLanguages.length > 0) {
    targetLanguages = targetLanguages.filter(lang => onlyLanguages.includes(lang));
  }

  const createdEmails: Array<{ email: any; language: string }> = [];

  // 3. Translate to each target language
  for (const language of targetLanguages) {
    // Extract translatable content
    const extractedContent = extractContentAndAlt(sourceEmail.customHtml);
    const cleanedContent = cleanUpExtractedData(extractedContent);

    // Prepare translation prompts
    const systemPrompt = `You are a professional translator. Translate the following text segments to ${language}.
Preserve all HTML tags and structure exactly as they appear.
DO NOT create new tags or remove existing ones.
Maintain Mautic personalization tokens like {contactfield=firstname}.`;

    const userPrompt = cleanedContent.join('\n---\n');

    // Translate content using OpenAI
    const translatedSegments = await openAIClient.translate(
      systemPrompt,
      userPrompt,
      language
    );

    // Reconstruct HTML with translations
    let translatedHtml = sourceEmail.customHtml;
    cleanedContent.forEach((original, index) => {
      const translated = translatedSegments[index];
      translatedHtml = translatedHtml.replace(original, translated);
    });

    // Update HTML attributes for language and direction
    const $ = cheerio.load(translatedHtml);
    $('html').attr('lang', language);

    // Set text direction for RTL languages
    if (['ar', 'he'].includes(language)) {
      $('html').attr('dir', 'rtl');
      $('[style*="text-align"]').removeAttr('style'); // Remove conflicting styles
    }

    translatedHtml = $.html();

    // Translate subject line as well
    let translatedSubject = sourceEmail.subject;
    if (sourceEmail.subject) {
      const subjectTranslation = await openAIClient.translateSingle(
        sourceEmail.subject,
        language,
        'This is an email subject line. Keep it concise and engaging.'
      );
      translatedSubject = subjectTranslation;
    }

    // 4. Create translated email in Mautic
    // IMPORTANT: Remove fields that should not be copied, including translation parent fields
    // that may have null values from the source email
    const {
      id,
      translationParent: _translationParent,
      translationChildren: _translationChildren,
      templateTranslationParent: _templateTranslationParent,  // CRITICAL: Exclude to prevent null override
      segmentTranslationParent: _segmentTranslationParent,    // CRITICAL: Exclude to prevent null override
      dateAdded,
      dateModified,
      createdBy,
      createdByUser,
      modifiedBy,
      modifiedByUser,
      ...emailBase
    } = sourceEmail;

    const translatedEmailData = {
      ...emailBase,
      name: `${sourceEmail.name} - ${language.toUpperCase()}`,
      subject: translatedSubject,
      language,
      customHtml: translatedHtml,
      templateTranslationParent: emailId  // Link to parent using correct field name
                                          // Use templateTranslationParent for template emails
                                          // Use segmentTranslationParent for list emails
    };

    const createdEmail = await mauticClient.createEmail(translatedEmailData);

    createdEmails.push({
      email: createdEmail,
      language
    });
  }

  return createdEmails;
}
```

**Key Implementation Details**:

1. **Authentication**: Uses Basic Auth with Mautic credentials
2. **Content Extraction**: Cheerio parses HTML to find translatable text
3. **Translation**: OpenAI translates extracted segments (including subject line)
4. **HTML Reconstruction**: Replaces original text with translations, sets `lang` and `dir` attributes
5. **Critical Field Exclusion**: Explicitly excludes `templateTranslationParent` and `segmentTranslationParent` from source email when spreading properties to prevent null values from overriding the parent link
6. **Email Creation**: Creates linked translated emails using `templateTranslationParent` field (for template emails) or `segmentTranslationParent` (for list emails)
7. **Duplicate Prevention**: Skips languages with existing translations
8. **RTL Support**: Automatically sets `dir="rtl"` for Arabic and Hebrew emails

### Testing Requirements
- Unit tests for translation logic
- Integration tests with Mautic API
- Mock API responses for development
- Error scenario testing
- Performance testing with multiple locales

### Security Considerations
- Validate and sanitize all input parameters
- Implement rate limiting on the endpoint
- Use API authentication (Bearer token or API key)
- Log all translation operations for audit
- Sanitize HTML content to prevent XSS
- Validate locale codes against whitelist

### Performance Optimization
- Cache Mautic API tokens
- Batch translation requests to OpenAI
- Implement request queuing for large batches
- Use concurrent processing for multiple locales
- Cache frequently translated content
- Implement progress tracking for long operations

## Usage Example

### Request: Translate to All Configured Languages

```bash
# Translate email ID 123 to all configured languages (except English)
curl -X POST http://localhost:5173/api/mautic/emails/123/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -d '{}'
```

### Request: Translate to Specific Languages

```bash
# Translate email ID 123 to Spanish and French only
curl -X POST http://localhost:5173/api/mautic/emails/123/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -d '{
    "languages": ["es", "fr"]
  }'
```

### Response

```json
[
  {
    "email": {
      "id": 124,
      "name": "Welcome Email - ES",
      "subject": "Bienvenido a Lupin Learn",
      "customHtml": "<html lang=\"es\">...</html>",
      "language": "es",
      "translationParent": 123,
      "isPublished": true
    },
    "language": "es"
  },
  {
    "email": {
      "id": 125,
      "name": "Welcome Email - FR",
      "subject": "Bienvenue à Lupin Learn",
      "customHtml": "<html lang=\"fr\">...</html>",
      "language": "fr",
      "translationParent": 123,
      "isPublished": true
    },
    "language": "fr"
  }
]
```

**Response Notes**:
- Returns array of created email objects
- Each email is linked to parent using `templateTranslationParent` or `segmentTranslationParent` field
- Mautic internally maps these fields to `translationParent` in the response
- Parent email's `translationChildren` array is automatically updated by Mautic
- Skips languages that already have translations
- RTL languages (Arabic, Hebrew) have `dir="rtl"` attribute set in HTML

## Additional Implementation Notes

1. **CRITICAL - Translation Parent Field Exclusion**: When copying fields from the source email, you MUST explicitly exclude `templateTranslationParent` and `segmentTranslationParent` from the destructured object. Source emails typically have these fields set to `null`, and if you spread `...sourceEmail` without excluding them, these `null` values will override your explicit setting of `templateTranslationParent: emailId`. This is a common bug that prevents translation parent-child relationships from being established.

   ```typescript
   // INCORRECT - null values will override parent link
   const translatedEmailData = {
     ...sourceEmail,
     templateTranslationParent: emailId  // This gets overridden by null from sourceEmail!
   };

   // CORRECT - explicitly exclude translation parent fields
   const {
     id,
     translationParent: _translationParent,
     translationChildren: _translationChildren,
     templateTranslationParent: _templateTranslationParent,  // CRITICAL
     segmentTranslationParent: _segmentTranslationParent,    // CRITICAL
     ...emailBase
   } = sourceEmail;

   const translatedEmailData = {
     ...emailBase,
     templateTranslationParent: emailId  // Now this works correctly
   };
   ```

2. **Field Name Mapping**: Mautic uses email-type-specific field names that map internally to `translationParent`:
   - Template emails (`emailType: "template"`): Use `templateTranslationParent`
   - List/segment emails (`emailType: "list"`): Use `segmentTranslationParent`

   Reference: [Mautic PR #15070](https://github.com/mautic/mautic/pull/15070) which implemented the `TranslationEntityTrait` for proper translation parent handling.

3. **Preserve Email Structure**: Ensure that the email template structure, CSS styles, and responsive design are maintained in translated versions

4. **Handle Dynamic Content**: Properly handle Mautic's dynamic content blocks and conditional content during translation

5. **Segment Association**: Maintain the same segment associations for translated emails as the parent email