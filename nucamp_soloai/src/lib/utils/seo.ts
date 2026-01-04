/**
 * SEO utility functions for generating meta tags and structured data
 */

export interface SEOConfig {
	title: string;
	description: string;
	canonical?: string;
	ogImage?: string;
	ogType?: 'website' | 'article' | 'profile';
	twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
	noindex?: boolean;
	nofollow?: boolean;
}

/**
 * Default SEO configuration
 * These values should be overridden by environment variables in production
 */
export const DEFAULT_SEO = {
	siteName: 'SoloAI SaaS',
	siteUrl: 'https://soloai.example.com', // TODO: Replace with actual domain from env
	defaultDescription:
		'Transform your business with AI-powered solutions. Intelligent automation and analytics for modern entrepreneurs.',
	defaultOgImage: '/og-image.jpg',
	twitterHandle: '@soloai' // TODO: Replace with actual handle from env
} as const;

/**
 * Generate a complete page title with brand suffix
 */
export function generateTitle(pageTitle: string, includeSiteName = true): string {
	if (!includeSiteName) return pageTitle;
	return `${pageTitle} | ${DEFAULT_SEO.siteName}`;
}

/**
 * Generate canonical URL for the current page
 */
export function generateCanonicalUrl(pathname: string, locale?: string): string {
	const url = new URL(pathname, DEFAULT_SEO.siteUrl);
	if (locale && locale !== 'en') {
		url.pathname = `/${locale}${pathname}`;
	}
	return url.toString();
}

/**
 * Sanitize and truncate meta description to optimal length
 */
export function sanitizeDescription(description: string, maxLength = 160): string {
	// Remove HTML tags
	const sanitized = description.replace(/<[^>]*>/g, '');
	// Truncate to max length
	if (sanitized.length <= maxLength) return sanitized;
	return sanitized.substring(0, maxLength - 3) + '...';
}

/**
 * Generate Open Graph image URL
 */
export function generateOgImageUrl(imagePath?: string): string {
	if (!imagePath) return `${DEFAULT_SEO.siteUrl}${DEFAULT_SEO.defaultOgImage}`;
	if (imagePath.startsWith('http')) return imagePath;
	return `${DEFAULT_SEO.siteUrl}${imagePath}`;
}

/**
 * Generate structured data for organization
 */
export function generateOrganizationSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: DEFAULT_SEO.siteName,
		url: DEFAULT_SEO.siteUrl,
		logo: `${DEFAULT_SEO.siteUrl}/android-chrome-512x512.png`,
		sameAs: [
			// TODO: Add social media URLs from environment variables
		]
	};
}

/**
 * Generate structured data for website
 */
export function generateWebsiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: DEFAULT_SEO.siteName,
		url: DEFAULT_SEO.siteUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${DEFAULT_SEO.siteUrl}/search?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

/**
 * Generate robots meta tag value
 */
export function generateRobotsContent(options: { noindex?: boolean; nofollow?: boolean } = {}): string {
	const parts: string[] = [];
	if (options.noindex) parts.push('noindex');
	else parts.push('index');

	if (options.nofollow) parts.push('nofollow');
	else parts.push('follow');

	return parts.join(', ');
}
