# TS02: Data-TestID Attribute Setup for Testing

## Overview
Establish a robust testing infrastructure by adding `data-testid` attributes to all testable elements across the application. This foundational step ensures stable, maintainable E2E and integration tests that survive refactoring, styling changes, and content updates.

## Business Value
- **Reduced Test Maintenance**: Tests don't break when CSS classes or text content changes
- **Faster Development**: Developers can refactor UI with confidence
- **Better Test Coverage**: Clear identification of testable elements encourages comprehensive testing
- **Cross-Language Support**: Works consistently across all 13 language locales
- **Developer Experience**: Explicit test IDs make it obvious which elements are meant to be tested

## Requirements

### Functional Requirements
- **Naming Convention**: Use kebab-case with descriptive names (e.g., `data-testid="login-submit"`)
- **Uniqueness**: Each `data-testid` must be unique within its page/component context
- **Semantic Meaning**: Test IDs should describe the element's purpose, not its appearance
- **Consistency**: Follow consistent patterns across similar elements (e.g., all submit buttons end with `-submit`)
- **Coverage**: Add test IDs to all interactive elements (buttons, inputs, links, forms)

### Non-Functional Requirements
- **Zero Performance Impact**: `data-testid` attributes have no runtime overhead
- **Accessibility**: Use alongside proper ARIA attributes (not as replacement)
- **Maintainability**: Test IDs should be self-documenting and easy to search in codebase
- **Documentation**: Keep a registry of all test IDs for reference

## Technical Specifications

### Naming Convention Standards

#### Pattern Structure
```
data-testid="{page/component}-{element}-{type}"
```

#### Examples
```html
<!-- Page-specific elements -->
<form data-testid="login-form">
<input data-testid="login-email">
<button data-testid="login-submit">

<!-- Component-specific elements -->
<nav data-testid="nav-main">
<button data-testid="nav-signup-button">

<!-- Section-specific elements -->
<section data-testid="hero-section">
<h1 data-testid="hero-heading">
<button data-testid="hero-signup-button">
```

#### Type Suffixes
- `-form` - Form elements
- `-input`, `-email`, `-password` - Input fields
- `-submit`, `-button` - Buttons
- `-link` - Anchor tags
- `-error`, `-alert` - Error/alert messages
- `-section`, `-container` - Wrapper elements
- `-heading`, `-title` - Headings
- `-modal`, `-dialog` - Modals and dialogs

### Priority Elements for Testing

#### Critical Path Elements (Priority 1)
1. **Authentication Flow**
   - All login form elements
   - All signup form elements
   - Password reset elements
   - OAuth provider buttons
   - Logout buttons

2. **Navigation**
   - Main navigation buttons
   - Language switcher
   - Account dropdown
   - Mobile menu toggles

3. **Conversion Points**
   - Signup CTA buttons
   - Checkout buttons
   - Contact form submit
   - Newsletter signup

#### Important Elements (Priority 2)
1. **Form Inputs**
   - All text inputs
   - All select dropdowns
   - All checkboxes/radio buttons
   - File upload inputs

2. **Error States**
   - Form validation errors
   - Page-level errors
   - Toast notifications
   - Alert messages

3. **Content Sections**
   - Hero sections
   - Feature sections
   - Pricing sections
   - FAQ sections

#### Nice-to-Have Elements (Priority 3)
1. **Secondary Actions**
   - "Learn More" buttons
   - Social media links
   - Footer links
   - Breadcrumbs

2. **Loading States**
   - Spinners
   - Skeleton loaders
   - Progress indicators

## Implementation Guide

### Step 1: Authentication Pages

#### Login Page (`src/routes/login/+page.svelte`)
```svelte
<form data-testid="login-form">
    <!-- Error Alert -->
    {#if error}
        <div role="alert" data-testid="login-error">
            <p>{error}</p>
        </div>
    {/if}

    <!-- Email Input -->
    <input
        type="email"
        name="email"
        data-testid="login-email"
        required
    />

    <!-- Password Input -->
    <input
        type="password"
        name="password"
        data-testid="login-password"
        required
    />

    <!-- Submit Button -->
    <button type="submit" data-testid="login-submit">
        Sign In
    </button>

    <!-- Link to Signup -->
    <a href="/signup" data-testid="login-signup-link">
        Create Account
    </a>
</form>
```

#### Signup Page (`src/routes/signup/+page.svelte`)
```svelte
<form data-testid="signup-form">
    <!-- Error Alert -->
    {#if error}
        <div role="alert" data-testid="signup-error">
            <p>{error}</p>
        </div>
    {/if}

    <!-- Name Input -->
    <input
        type="text"
        name="name"
        data-testid="signup-name"
        required
    />

    <!-- Email Input -->
    <input
        type="email"
        name="email"
        data-testid="signup-email"
        required
    />

    <!-- Password Input -->
    <input
        type="password"
        name="password"
        data-testid="signup-password"
        required
    />

    <!-- Submit Button -->
    <button type="submit" data-testid="signup-submit">
        Create Account
    </button>

    <!-- Link to Login -->
    <a href="/login" data-testid="signup-login-link">
        Already have an account?
    </a>
</form>
```

### Step 2: Homepage Elements

#### Homepage (`src/routes/+page.svelte`)
```svelte
<!-- Hero Section -->
<section id="hero">
    <h1 data-testid="hero-heading">
        {landingPage.heroTitle}
    </h1>

    <p data-testid="hero-subtitle">
        {landingPage.heroSubtitle}
    </p>

    <p data-testid="hero-description">
        {landingPage.heroDescription}
    </p>

    <a href="/signup" data-testid="hero-signup-button">
        {landingPage.heroCtaText}
    </a>
</section>

<!-- Features Section -->
<div data-testid="features-section">
    <FeaturesSection {features} />
</div>

<!-- Pricing Section -->
<section id="pricing" data-testid="pricing-section">
    <PricingSection />
</section>

<!-- Contact Section -->
<div data-testid="contact-section">
    <ContactSection {faqs} />
</div>
```

### Step 3: Navigation Component

#### Navigation (`src/lib/components/Nav.svelte`)
```svelte
<nav data-testid="nav-main">
    <!-- Logo -->
    <a href="/" data-testid="nav-logo">
        {m["nav.brand"]()}
    </a>

    <!-- Navigation Links -->
    <ul>
        <li><a href="/" data-testid="nav-home-link">Home</a></li>
        <li><a href="/#features" data-testid="nav-features-link">Features</a></li>
        <li><a href="/#pricing" data-testid="nav-pricing-link">Pricing</a></li>
    </ul>

    <!-- CTA Buttons -->
    {#if isAuthenticated}
        <a href="/account" data-testid="nav-account-button">
            My Account
        </a>
    {:else}
        <a href="/signup" data-testid="nav-signup-button">
            Sign Up
        </a>
    {/if}
</nav>
```

### Step 4: Pricing Components

#### Pricing Tier Cards
```svelte
{#each tiers as tier}
    <div class="pricing-card" data-testid="pricing-tier-{tier.id}">
        <h3 data-testid="pricing-tier-name">{tier.name}</h3>
        <p data-testid="pricing-tier-price">${tier.price}/mo</p>
        <button data-testid="pricing-tier-cta-{tier.id}">
            Get Started
        </button>
    </div>
{/each}
```

### Step 5: Account/Dashboard Pages

#### Account Overview (`src/routes/account/+page.svelte`)
```svelte
<section data-testid="account-overview">
    <h1 data-testid="account-heading">My Account</h1>

    <!-- User Info -->
    <div data-testid="account-user-info">
        <p data-testid="account-user-email">{user.email}</p>
        <p data-testid="account-user-tier">{user.subscriptionTier}</p>
    </div>

    <!-- Action Buttons -->
    <a href="/account/profile" data-testid="account-profile-link">
        Edit Profile
    </a>
    <a href="/account/billing" data-testid="account-billing-link">
        Manage Billing
    </a>
    <button data-testid="account-logout-button">
        Logout
    </button>
</section>
```

## Best Practices

### Do's ✅

1. **Use Semantic Names**
   ```html
   <!-- Good -->
   <button data-testid="checkout-submit">Checkout</button>

   <!-- Bad -->
   <button data-testid="button1">Checkout</button>
   ```

2. **Be Consistent**
   ```html
   <!-- All submit buttons follow pattern -->
   <button data-testid="login-submit">Sign In</button>
   <button data-testid="signup-submit">Create Account</button>
   <button data-testid="contact-submit">Send Message</button>
   ```

3. **Use Kebab-Case**
   ```html
   <!-- Good -->
   <input data-testid="user-email-input">

   <!-- Bad -->
   <input data-testid="userEmailInput">
   <input data-testid="user_email_input">
   ```

4. **Include Context**
   ```html
   <!-- Good - clear which signup button -->
   <button data-testid="hero-signup-button">Sign Up</button>
   <button data-testid="nav-signup-button">Sign Up</button>

   <!-- Bad - ambiguous -->
   <button data-testid="signup">Sign Up</button>
   ```

### Don'ts ❌

1. **Don't Use Dynamic Values**
   ```html
   <!-- Bad - breaks tests when ID changes -->
   <div data-testid="user-{userId}">

   <!-- Good - stable identifier -->
   <div data-testid="user-profile">
   ```

2. **Don't Duplicate Test IDs**
   ```html
   <!-- Bad - not unique -->
   <button data-testid="submit">Login</button>
   <button data-testid="submit">Signup</button>

   <!-- Good - unique per context -->
   <button data-testid="login-submit">Login</button>
   <button data-testid="signup-submit">Signup</button>
   ```

3. **Don't Use for Styling**
   ```css
   /* Bad - don't use test IDs for CSS */
   [data-testid="button"] { color: blue; }

   /* Good - use classes for styling */
   .btn-primary { color: blue; }
   ```

4. **Don't Skip Error States**
   ```html
   <!-- Bad - error not testable -->
   {#if error}
       <div class="alert">{error}</div>
   {/if}

   <!-- Good - error is testable -->
   {#if error}
       <div role="alert" data-testid="form-error">{error}</div>
   {/if}
   ```

## Verification Checklist

Use this checklist to ensure complete coverage:

### Authentication Pages
- [ ] Login form and all inputs
- [ ] Signup form and all inputs
- [ ] Password reset form
- [ ] Error messages
- [ ] Submit buttons
- [ ] Navigation links between auth pages

### Navigation
- [ ] Main navigation bar
- [ ] Mobile menu toggle
- [ ] Language switcher
- [ ] User account dropdown
- [ ] Signup/Login CTAs

### Homepage
- [ ] Hero section and CTA
- [ ] Features section
- [ ] Pricing section
- [ ] Contact/FAQ section
- [ ] Footer links

### Account Pages
- [ ] Profile edit form
- [ ] Billing/subscription management
- [ ] Settings forms
- [ ] Logout button

### Forms
- [ ] All input fields
- [ ] All submit buttons
- [ ] All validation error messages
- [ ] All success messages

### Modals/Dialogs
- [ ] Modal triggers
- [ ] Modal close buttons
- [ ] Modal content areas
- [ ] Modal action buttons

## Integration with Testing

### Usage in Page Objects
```typescript
// e2e/pages/LoginPage.ts
export class LoginPage extends BasePage {
    // Use data-testid attributes
    readonly emailInput = '[data-testid="login-email"]';
    readonly passwordInput = '[data-testid="login-password"]';
    readonly submitButton = '[data-testid="login-submit"]';
    readonly errorMessage = '[data-testid="login-error"]';

    async login(email: string, password: string) {
        await this.fill(this.emailInput, email);
        await this.fill(this.passwordInput, password);
        await this.click(this.submitButton);
    }
}
```

### Usage in Tests
```typescript
test('user can login', async ({ page }) => {
    await page.goto('/login');

    // Stable selectors using data-testid
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit"]');

    // Verify success
    await expect(page.locator('[data-testid="account-heading"]')).toBeVisible();
});
```

## Maintenance

### When to Add New Test IDs
1. **New Features**: Add test IDs during feature development, not after
2. **Refactoring**: Keep test IDs stable even when refactoring
3. **Bug Fixes**: If a bug wasn't caught by tests, add test IDs to enable future testing

### Test ID Registry
Maintain a reference document listing all test IDs:

```markdown
## Authentication
- `login-form` - Login form container
- `login-email` - Email input on login page
- `login-password` - Password input on login page
- `login-submit` - Login submit button
- `login-error` - Login error message

## Navigation
- `nav-main` - Main navigation bar
- `nav-signup-button` - Signup button in nav
- `nav-account-button` - Account button in nav (authenticated)
```

## Prerequisites
- A03-Configure-Tailwind-DaisyUI.md (UI components exist)
- A06-Nav-Menu.md (Navigation exists)
- L01-Login-Route.md (Login page exists)
- S01-Signup-Route.md (Signup page exists)

## Next Steps
After completing this setup:
1. TS03-Vitest-Setup.md - Set up unit testing framework
2. TS04-Playwright-Setup.md - Set up E2E testing framework
3. TS05-Write-Basic-Tests.md - Write comprehensive tests using the test IDs

## Success Criteria
- [ ] All authentication pages have test IDs
- [ ] All navigation elements have test IDs
- [ ] All form inputs have test IDs
- [ ] All submit buttons have test IDs
- [ ] All error messages have test IDs
- [ ] All CTAs have test IDs
- [ ] Test ID naming convention is consistent
- [ ] Test ID registry is documented
- [ ] Page objects use test IDs instead of CSS selectors
