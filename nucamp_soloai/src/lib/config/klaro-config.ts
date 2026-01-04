/**
 * Klaro Consent Manager Configuration
 * (TC03-GDPR-Consent-Manager.md)
 *
 * Implements GDPR-compliant cookie consent management for non-US users.
 * US users (locale: 'en') bypass consent and have all tracking enabled.
 * Non-US users see the Klaro consent banner and must explicitly consent.
 *
 * Integrates with Google Consent Mode V2 for GTM tag control.
 */

import { browser } from '$app/environment';
import { getLocale } from '$lib/paraglide/runtime';

// ============================================================================
// Type Definitions for Klaro
// ============================================================================

/**
 * Klaro service configuration
 */
export interface KlaroService {
	name: string;
	title: string;
	description?: string;
	purposes: string[];
	required?: boolean;
	default?: boolean;
	optOut?: boolean;
	onlyOnce?: boolean;
	cookies?: (string | RegExp)[];
	onInit?: () => void;
	onAccept?: () => void;
	onDecline?: () => void;
}

/**
 * Klaro translation structure
 */
export interface KlaroTranslation {
	consentNotice?: {
		title?: string;
		description?: string;
		learnMore?: string;
	};
	consentModal?: {
		title?: string;
		description?: string;
	};
	purposes?: Record<string, string>;
	ok?: string;
	acceptAll?: string;
	acceptSelected?: string;
	decline?: string;
	close?: string;
	save?: string;
	poweredBy?: string;
	privacyPolicy?: {
		name?: string;
		text?: string;
	};
}

/**
 * Klaro configuration interface
 */
export interface KlaroConfig {
	version?: number;
	elementID?: string;
	storageMethod?: 'localStorage' | 'cookie';
	storageName?: string;
	cookieName?: string;
	cookieExpiresAfterDays?: number;
	cookieDomain?: string;
	privacyPolicy?: string;
	default?: boolean;
	mustConsent?: boolean;
	acceptAll?: boolean;
	hideDeclineAll?: boolean;
	hideLearnMore?: boolean;
	noticeAsModal?: boolean;
	disablePoweredBy?: boolean;
	lang?: string;
	translations?: Record<string, KlaroTranslation>;
	services?: KlaroService[];
}

// ============================================================================
// Extend Window for GTM/Consent Mode
// ============================================================================

declare global {
	interface Window {
		dataLayer: unknown[];
		gtag: (...args: unknown[]) => void;
		klaro?: {
			show: (config?: KlaroConfig, modal?: boolean) => void;
			getManager: (config?: KlaroConfig) => unknown;
		};
	}
}

// ============================================================================
// Locale Detection Utilities
// ============================================================================

/**
 * Check if user is from US (doesn't need consent)
 * US users are identified by 'en' locale
 */
export function isUSUser(): boolean {
	if (!browser) return false;
	return getLocale() === 'en';
}

/**
 * Check if consent is required for current user
 */
export function requiresConsent(): boolean {
	return !isUSUser();
}

// ============================================================================
// Klaro Translations
// ============================================================================

const translations: Record<string, KlaroTranslation> = {
	en: {
		consentNotice: {
			title: 'We value your privacy',
			description:
				'We use cookies and similar technologies to improve your experience, analyze site traffic, and personalize content. You can choose which categories of cookies to accept.',
			learnMore: 'Learn more'
		},
		consentModal: {
			title: 'Cookie Preferences',
			description: 'Here you can see and customize the information we collect about you.'
		},
		purposes: {
			analytics: 'Analytics',
			marketing: 'Marketing',
			functional: 'Functional'
		},
		ok: 'Accept Selected',
		acceptAll: 'Accept All',
		acceptSelected: 'Accept Selected',
		decline: 'Reject All',
		close: 'Close',
		save: 'Save',
		poweredBy: 'Powered by Klaro',
		privacyPolicy: {
			name: 'Privacy Policy',
			text: 'Read our {privacyPolicy}'
		}
	},
	es: {
		consentNotice: {
			title: 'Valoramos tu privacidad',
			description:
				'Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido.',
			learnMore: 'Más información'
		},
		consentModal: {
			title: 'Preferencias de Cookies',
			description: 'Aquí puedes ver y personalizar la información que recopilamos sobre ti.'
		},
		purposes: {
			analytics: 'Analítica',
			marketing: 'Marketing',
			functional: 'Funcional'
		},
		ok: 'Aceptar Selección',
		acceptAll: 'Aceptar Todo',
		acceptSelected: 'Aceptar Selección',
		decline: 'Rechazar Todo',
		close: 'Cerrar',
		save: 'Guardar',
		poweredBy: 'Desarrollado por Klaro',
		privacyPolicy: {
			name: 'Política de Privacidad',
			text: 'Lee nuestra {privacyPolicy}'
		}
	},
	fr: {
		consentNotice: {
			title: 'Nous respectons votre vie privée',
			description:
				'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.',
			learnMore: 'En savoir plus'
		},
		consentModal: {
			title: 'Préférences de Cookies',
			description: 'Ici vous pouvez voir et personnaliser les informations que nous collectons.'
		},
		purposes: {
			analytics: 'Analytique',
			marketing: 'Marketing',
			functional: 'Fonctionnel'
		},
		ok: 'Accepter la sélection',
		acceptAll: 'Tout accepter',
		acceptSelected: 'Accepter la sélection',
		decline: 'Tout refuser',
		close: 'Fermer',
		save: 'Sauvegarder',
		poweredBy: 'Propulsé par Klaro',
		privacyPolicy: {
			name: 'Politique de Confidentialité',
			text: 'Lire notre {privacyPolicy}'
		}
	},
	de: {
		consentNotice: {
			title: 'Wir schätzen Ihre Privatsphäre',
			description:
				'Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu verbessern und den Datenverkehr zu analysieren.',
			learnMore: 'Mehr erfahren'
		},
		consentModal: {
			title: 'Cookie-Einstellungen',
			description:
				'Hier können Sie die Informationen sehen und anpassen, die wir über Sie sammeln.'
		},
		purposes: {
			analytics: 'Analytik',
			marketing: 'Marketing',
			functional: 'Funktional'
		},
		ok: 'Auswahl akzeptieren',
		acceptAll: 'Alle akzeptieren',
		acceptSelected: 'Auswahl akzeptieren',
		decline: 'Alle ablehnen',
		close: 'Schließen',
		save: 'Speichern',
		poweredBy: 'Powered by Klaro',
		privacyPolicy: {
			name: 'Datenschutzerklärung',
			text: 'Lesen Sie unsere {privacyPolicy}'
		}
	},
	it: {
		consentNotice: {
			title: 'Rispettiamo la tua privacy',
			description:
				'Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza e analizzare il traffico.',
			learnMore: 'Scopri di più'
		},
		consentModal: {
			title: 'Preferenze Cookie',
			description: 'Qui puoi vedere e personalizzare le informazioni che raccogliamo su di te.'
		},
		purposes: {
			analytics: 'Analitica',
			marketing: 'Marketing',
			functional: 'Funzionale'
		},
		ok: 'Accetta selezione',
		acceptAll: 'Accetta tutto',
		acceptSelected: 'Accetta selezione',
		decline: 'Rifiuta tutto',
		close: 'Chiudi',
		save: 'Salva',
		poweredBy: 'Powered by Klaro',
		privacyPolicy: {
			name: 'Informativa sulla Privacy',
			text: 'Leggi la nostra {privacyPolicy}'
		}
	},
	pt: {
		consentNotice: {
			title: 'Valorizamos sua privacidade',
			description:
				'Usamos cookies e tecnologias semelhantes para melhorar sua experiência e analisar o tráfego.',
			learnMore: 'Saiba mais'
		},
		consentModal: {
			title: 'Preferências de Cookies',
			description: 'Aqui você pode ver e personalizar as informações que coletamos sobre você.'
		},
		purposes: {
			analytics: 'Analítico',
			marketing: 'Marketing',
			functional: 'Funcional'
		},
		ok: 'Aceitar seleção',
		acceptAll: 'Aceitar tudo',
		acceptSelected: 'Aceitar seleção',
		decline: 'Rejeitar tudo',
		close: 'Fechar',
		save: 'Salvar',
		poweredBy: 'Powered by Klaro',
		privacyPolicy: {
			name: 'Política de Privacidade',
			text: 'Leia nossa {privacyPolicy}'
		}
	}
};

// ============================================================================
// Klaro Configuration
// ============================================================================

/**
 * Get Klaro configuration for GDPR consent management
 * Integrates with Google Consent Mode V2 and GTM
 */
export function getKlaroConfig(): KlaroConfig {
	const usUser = isUSUser();

	return {
		// Version number - increment when making changes to force re-consent
		version: 1,

		// Element ID where Klaro will mount
		elementID: 'klaro',

		// Storage method and key
		storageMethod: 'localStorage',
		storageName: 'klaro-consent',

		// Consent expires after 365 days (GDPR requirement)
		cookieExpiresAfterDays: 365,

		// Privacy policy link
		privacyPolicy: '/privacy',

		// Don't require consent for US users
		mustConsent: !usUser,

		// Show accept all button
		acceptAll: true,

		// Show decline button
		hideDeclineAll: false,

		// Show learn more link
		hideLearnMore: false,

		// Show as banner, not modal
		noticeAsModal: false,

		// Hide "Powered by Klaro" for cleaner UI
		disablePoweredBy: true,

		// Translations
		translations,

		// Services configuration
		services: [
			{
				// Google Tag Manager - Required service that initializes consent mode
				name: 'google-tag-manager',
				title: 'Google Tag Manager',
				purposes: ['functional'],
				required: true,
				default: true,

				// Initialize Google Consent Mode V2
				onInit: function () {
					if (typeof window === 'undefined') return;

					window.dataLayer = window.dataLayer || [];
					window.gtag = function () {
						window.dataLayer.push(arguments);
					};

					// Set default consent state based on locale
					if (!usUser) {
						// Non-US users: all denied by default (GDPR compliant)
						window.gtag('consent', 'default', {
							ad_storage: 'denied',
							ad_user_data: 'denied',
							ad_personalization: 'denied',
							analytics_storage: 'denied',
							functionality_storage: 'denied',
							personalization_storage: 'denied',
							security_storage: 'granted',
							wait_for_update: 2000
						});
					} else {
						// US users: all granted by default
						window.gtag('consent', 'default', {
							ad_storage: 'granted',
							ad_user_data: 'granted',
							ad_personalization: 'granted',
							analytics_storage: 'granted',
							functionality_storage: 'granted',
							personalization_storage: 'granted',
							security_storage: 'granted'
						});
					}
				},

				cookies: []
			},
			{
				// Google Analytics 4
				name: 'google-analytics',
				title: 'Google Analytics',
				description:
					'We use Google Analytics to understand how visitors interact with our website by collecting and reporting information anonymously.',
				purposes: ['analytics'],
				required: false,
				default: usUser, // Default enabled only for US users

				onAccept: function () {
					if (typeof window === 'undefined' || !window.gtag) return;

					window.gtag('consent', 'update', {
						analytics_storage: 'granted'
					});

					// Fire custom event for GTM trigger
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						event: 'klaro-google-analytics-accepted'
					});
				},

				onDecline: function () {
					if (typeof window === 'undefined' || !window.gtag) return;

					window.gtag('consent', 'update', {
						analytics_storage: 'denied'
					});
				},

				// GA4 cookies pattern
				cookies: [/^_ga/, /^_gid/, /^_gat/]
			},
			{
				// Hotjar (now Contentsquare)
				name: 'hotjar',
				title: 'Hotjar',
				description:
					'Hotjar helps us understand user behavior through session recordings and heatmaps to improve your experience.',
				purposes: ['analytics', 'functional'],
				required: false,
				default: usUser, // Default enabled only for US users

				onAccept: function () {
					if (typeof window === 'undefined' || !window.gtag) return;

					window.gtag('consent', 'update', {
						functionality_storage: 'granted'
					});

					// Fire custom event for GTM trigger
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						event: 'klaro-hotjar-accepted'
					});
				},

				onDecline: function () {
					if (typeof window === 'undefined' || !window.gtag) return;

					window.gtag('consent', 'update', {
						functionality_storage: 'denied'
					});
				},

				// Hotjar cookies pattern
				cookies: [/^_hj/]
			}
		]
	};
}

/**
 * Show Klaro consent modal programmatically
 */
export function showConsentModal(): void {
	if (!browser || !window.klaro) return;
	window.klaro.show(undefined, true);
}

/**
 * Get Klaro manager for programmatic access
 */
export function getKlaroManager(): unknown {
	if (!browser || !window.klaro) return null;
	return window.klaro.getManager();
}
