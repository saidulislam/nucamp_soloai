# A00-Manual-Init.md

## Overview
Initialize a SvelteKit project following the official documentation with specific configuration choices for our SaaS application.

**Feature Type**: Project Initialization

**Learning Objective**: Set up a modern SvelteKit project with Svelte 5 and Paraglide JS for internationalization.

## Requirements

### Prerequisites
- Node.js 18+ and npm 9+ installed
- Terminal/command line access
- Code editor (VS Code recommended)

## Setup Instructions

### Step 1: Follow Official SvelteKit Setup

Follow the instructions at: https://svelte.dev/docs/kit/creating-a-project

When prompted during setup, select these options:
- **Template**: SvelteKit demo app
- **Type checking**: Yes, using TypeScript syntax
- **Additional options**:
  - ✅ Add ESLint for code linting
  - ❎ Do not add Prettier for code formatting
  - ✅ Add Playwright for browser testing (optional)
  - ✅ Add Vitest for unit testing (optional)
  - ✅ Add Paraglide JS for internationalization and the languages "en", "fr", "es", "hi", "pt", "nl", "de", "it", "ur", "ar", "ru", "zh", "fi"
  
### Step 2: Verify Setup

```bash
npm run dev
```

Visit http://localhost:5173 to see the demo app running.

## Verification Checklist

- [ ] SvelteKit project created following official docs
- [ ] TypeScript enabled
- [ ] Paraglide JS selected during setup and configured with the right languages
- [ ] Environment files created
- [ ] Development server runs successfully

## Next Steps

Proceed to the next lesson to start building the SaaS application features.