# Main Layout Component Implementation

## Overview
- Create a reusable main layout component with header, navigation, footer, and content slot for the SvelteKit SaaS application
- Establish consistent visual structure and navigation patterns across all pages
- Integrate with existing Tailwind CSS styling, Paraglide i18n, Better Auth session management, and Strapi CMS content
- Feature type: User-Facing Feature

## Requirements

### User Stories
- As a visitor, I want consistent navigation and branding across all pages so I can easily navigate the application
- As a user, I want to see my authentication status and account options in the header so I can access my account or sign in
- As a content manager, I want the layout to support multilingual content so users can switch languages seamlessly
- As a developer, I want a reusable layout component so I can maintain consistent styling across all routes

### UI/UX Requirements
- **Header Section**: Logo/brand, main navigation menu, language switcher, authentication status/buttons
- **Navigation Menu**: Links to all core public pages (/, /features, /pricing, /contact, /privacy, /terms)
- **Authentication Area**: Dynamic display of login/signup buttons for guests or user menu for authenticated users
- **Language Switcher**: Dropdown or button group for switching between English, Spanish, and French
- **Content Area**: Main slot for page-specific content with proper spacing and constraints
- **Footer Section**: Links, copyright, social media, legal pages
- **Responsive Design**: Mobile-first approach with hamburger menu for smaller screens
- **Visual Hierarchy**: Clear separation between header, main content, and footer sections

### User Flow
1. User visits any page and sees consistent header with logo and navigation
2. User can click navigation links to move between pages
3. User can change language via language switcher in header
4. Authenticated users see account options; guests see login/signup options
5. User scrolls to see main content in designated content area
6. User reaches footer with additional links and information

### Functional Requirements
- **Layout Structure**: Create `+layout.svelte` file in `src/routes/` directory with header, main content slot, and footer
- **Navigation Integration**: Include all routes from A01-Setup-Base-Routes.md specification
- **Authentication Integration**: Display user session status using Better Auth client from AU04-Global-Client-Setup.md
- **Language Integration**: Include language switcher from PG02-Paraglide-Configure-Langs.md
- **Content Slot**: Use `<slot />` element for page-specific content injection
- **Mobile Responsiveness**: Implement responsive navigation with hamburger menu for mobile devices
- **Loading States**: Handle loading states for authentication status and language switching
- **Error Boundaries**: Graceful handling of navigation and authentication errors

### Data Requirements
- **Session Data**: Access current user authentication status and user information
- **Locale Data**: Current selected language and available language options
- **Navigation Data**: Static navigation menu items with internationalized labels
- **Footer Data**: Company information, social links, legal page links

### Security Considerations
- **CSRF Protection**: Ensure navigation and authentication actions are protected
- **Session Validation**: Verify user session status before displaying authenticated UI elements
- **XSS Prevention**: Sanitize any dynamic content rendered in layout components
- **Route Protection**: Respect authentication guards established in AU05-Protect-Routes.md

### Performance Requirements
- **Layout Rendering**: Initial layout render must complete within 100ms
- **Navigation Response**: Navigation interactions must respond within 200ms
- **Language Switching**: Language changes must complete within 500ms
- **Mobile Performance**: Hamburger menu animation must be smooth at 60fps

## Technical Specifications
- **Dependencies**: 
  - Existing SvelteKit routing system from A01-Setup-Base-Routes.md
  - Better Auth client configuration from AU04-Global-Client-Setup.md
  - Paraglide i18n setup from PG01-Paraglide-Install.md and PG02-Paraglide-Configure-Langs.md
  - Tailwind CSS (to be configured in A03-Configure-Tailwind-DaisyUI.md)

- **Database Changes**: None required

- **API Changes**: None required

- **Environment Variables**: 
  - Use existing PUBLIC_DEFAULT_LOCALE and PUBLIC_SUPPORTED_LOCALES from Paraglide setup
  - Access authentication configuration from Better Auth environment variables

## Implementation Details

### File Structure
- Create `src/routes/+layout.svelte` as main layout component
- Create `src/lib/components/Header.svelte` for header section
- Create `src/lib/components/Navigation.svelte` for navigation menu
- Create `src/lib/components/Footer.svelte` for footer section
- Create `src/lib/components/LanguageSwitcher.svelte` for language selection
- Create `src/lib/components/AuthButton.svelte` for authentication UI

### Integration Points
- **Authentication**: Import and use Better Auth client from global context established in AU04-Global-Client-Setup.md
- **Internationalization**: Import and use Paraglide translation functions from PG01-Paraglide-Install.md
- **Routing**: Reference all routes created in A01-Setup-Base-Routes.md for navigation menu
- **Language Switching**: Use language switching functionality from PG02-Paraglide-Configure-Langs.md

### Navigation Structure
- **Public Pages**: Home (/), Features (/features), Pricing (/pricing), Contact (/contact)  
- **Legal Pages**: Privacy (/privacy), Terms (/terms)
- **Authentication Pages**: Login (/login), Signup (/signup) - shown conditionally based on auth status
- **Protected Pages**: Account (/account) - shown only for authenticated users

### Responsive Behavior
- **Desktop**: Horizontal navigation bar with all links visible
- **Tablet**: Condensed navigation with potential grouping of secondary links
- **Mobile**: Hamburger menu with slide-out or dropdown navigation panel

### Authentication States
- **Guest Users**: Show Login and Signup buttons in header
- **Authenticated Users**: Show user avatar/name with dropdown menu containing Account and Logout options
- **Loading State**: Show skeleton or spinner while authentication status is being determined

### Language Switcher
- Display current locale with country flag or language code
- Dropdown menu with available languages (English, Spanish, French)
- Persist language selection in localStorage
- Update page content immediately upon language change

## Prerequisites
- A01-Setup-Base-Routes.md (core application routes)
- AU04-Global-Client-Setup.md (Better Auth client configuration)
- PG01-Paraglide-Install.md (Paraglide i18n installation)
- PG02-Paraglide-Configure-Langs.md (language configuration and switcher)

## Future Integration Points
- Will integrate with Tailwind CSS and DaisyUI styling from upcoming A03-Configure-Tailwind-DaisyUI.md
- Error handling will be enhanced with custom error page from A05-Error-Page.md
- SEO meta tags will be added via A04-SEO-Meta-Config.md
- Navigation will include links to features pages created in later specifications