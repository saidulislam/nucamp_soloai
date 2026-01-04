/**
 * Email Translation Helper
 * Utilities for extracting and translating email content
 *
 * @see MA07-Email-Translations-Route.md
 */

import * as cheerio from 'cheerio';
import mauticService from '$lib/services/mautic';
import openAIService from '$lib/services/openai';
import { locales as availableLanguageTags } from '$lib/paraglide/runtime';
import type { MauticEmail, MauticEmailCreateData, TranslatedEmailResult } from '$lib/services/datamodel';

/**
 * Extract translatable content from HTML email
 * Extracts text from semantic tags while preserving structure
 */
function extractTranslatableContent(html: string): string[] {
	const $ = cheerio.load(html);
	const extractedContent: string[] = [];

	// Tags that typically contain translatable text
	const tags = ['title', 'p', 'a', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'li', 'label', 'button'];

	tags.forEach((tag) => {
		$(tag).each((_, element) => {
			const $el = $(element);

			// Get direct text content (excluding nested elements' text)
			const directText = $el.clone().children().remove().end().text().trim();

			if (directText && directText.length > 0) {
				// Skip if it's just whitespace or single punctuation
				if (!/^[\s\p{P}]*$/u.test(directText)) {
					extractedContent.push(directText);
				}
			}

			// Extract alt attributes from images
			if (tag === 'a' || tag === 'img') {
				const alt = $el.attr('alt');
				if (alt && alt.trim().length > 0) {
					extractedContent.push(alt.trim());
				}
			}
		});
	});

	return extractedContent;
}

/**
 * Clean up extracted data
 * Removes empty strings, single punctuation, URLs, and special characters
 */
function cleanUpExtractedData(data: string[]): string[] {
	return data
		.filter((item) => item.trim() !== '') // Remove empty
		.filter((item) => !/^[^\w\s]+$/.test(item)) // Remove single punctuation
		.filter((item) => !item.match(/^https?:\/\//)) // Remove raw URLs
		.filter((item) => item !== '\u200D') // Remove Unicode word joiners
		.filter((item) => !item.startsWith('{') || !item.endsWith('}')) // Skip Mautic tokens
		.filter((item, index, self) => self.indexOf(item) === index); // Remove duplicates
}

/**
 * Replace original text with translations in HTML
 * Uses exact string matching to preserve structure
 */
function replaceTranslations(
	html: string,
	originalSegments: string[],
	translatedSegments: string[]
): string {
	let translatedHtml = html;

	// Replace each segment, being careful with order (longer strings first)
	const sortedPairs = originalSegments
		.map((original, i) => ({ original, translated: translatedSegments[i] }))
		.sort((a, b) => b.original.length - a.original.length);

	for (const { original, translated } of sortedPairs) {
		if (original && translated && original !== translated) {
			// Use a regex that matches the exact text but preserves surrounding context
			const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			translatedHtml = translatedHtml.replace(new RegExp(escapedOriginal, 'g'), translated);
		}
	}

	return translatedHtml;
}

/**
 * Update HTML attributes for language and direction
 */
function updateHtmlAttributes(html: string, language: string): string {
	const $ = cheerio.load(html);

	// Set language attribute
	$('html').attr('lang', language);

	// Set text direction for RTL languages
	const rtlLanguages = ['ar', 'he', 'ur', 'fa'];
	if (rtlLanguages.includes(language)) {
		$('html').attr('dir', 'rtl');
		// Add RTL-specific styles if needed
		$('body').css('direction', 'rtl');
		$('body').css('text-align', 'right');
	} else {
		$('html').attr('dir', 'ltr');
	}

	return $.html();
}

/**
 * Translate email to multiple languages
 * Main function that orchestrates the translation process
 *
 * @param emailId Source email ID in Mautic
 * @param onlyLanguages Optional array of specific languages to translate to
 * @returns Array of created translated emails
 */
export async function translateEmail(
	emailId: number,
	onlyLanguages: string[] = []
): Promise<TranslatedEmailResult[]> {
	// 1. Fetch source email from Mautic
	const sourceEmail = await mauticService.getEmail(emailId);

	if (!sourceEmail) {
		throw new Error(`Email with ID ${emailId} not found`);
	}

	// 2. Determine target languages
	let targetLanguages = availableLanguageTags.filter((lang) => lang !== 'en');

	// Filter out languages that already have translations
	if (sourceEmail.translationChildren && sourceEmail.translationChildren.length > 0) {
		const existingLangs = sourceEmail.translationChildren.map((child) => child.language);
		targetLanguages = targetLanguages.filter((lang) => !existingLangs.includes(lang));
	}

	// Apply language filter if provided
	if (onlyLanguages.length > 0) {
		targetLanguages = targetLanguages.filter((lang) => onlyLanguages.includes(lang));
	}

	if (targetLanguages.length === 0) {
		console.log('No target languages to translate to');
		return [];
	}

	console.log(`Translating email ${emailId} to languages: ${targetLanguages.join(', ')}`);

	const createdEmails: TranslatedEmailResult[] = [];

	// 3. Process each target language
	for (const language of targetLanguages) {
		try {
			console.log(`Translating to ${language}...`);

			// Extract translatable content from HTML
			const extractedContent = extractTranslatableContent(sourceEmail.customHtml);
			const cleanedContent = cleanUpExtractedData(extractedContent);

			if (cleanedContent.length === 0) {
				console.warn(`No translatable content found for language ${language}`);
				continue;
			}

			// Translate content using OpenAI
			const translatedSegments = await openAIService.translateSegments(
				cleanedContent,
				language,
				true // preserve Mautic tokens
			);

			// Reconstruct HTML with translations
			let translatedHtml = replaceTranslations(
				sourceEmail.customHtml,
				cleanedContent,
				translatedSegments
			);

			// Update HTML attributes for language and direction
			translatedHtml = updateHtmlAttributes(translatedHtml, language);

			// Translate subject line
			let translatedSubject = sourceEmail.subject;
			if (sourceEmail.subject) {
				translatedSubject = await openAIService.translateSingle(
					sourceEmail.subject,
					language,
					'This is an email subject line. Keep it concise and engaging. Preserve any tokens like {contactfield=firstname}.'
				);
			}

			// Translate preheader text if present
			let translatedPreheader = sourceEmail.preheaderText;
			if (sourceEmail.preheaderText) {
				translatedPreheader = await openAIService.translateSingle(
					sourceEmail.preheaderText,
					language,
					'This is an email preheader text (preview text). Keep it concise.'
				);
			}

			// 4. Create translated email in Mautic
			// CRITICAL: Exclude translation parent fields from source to prevent null override
			const emailData: MauticEmailCreateData = {
				name: `${sourceEmail.name} - ${language.toUpperCase()}`,
				subject: translatedSubject,
				customHtml: translatedHtml,
				plainText: sourceEmail.plainText || undefined,
				emailType: sourceEmail.emailType,
				language: language,
				isPublished: sourceEmail.isPublished,
				fromName: sourceEmail.fromName || undefined,
				fromAddress: sourceEmail.fromAddress || undefined,
				replyToAddress: sourceEmail.replyToAddress || undefined,
				preheaderText: translatedPreheader || undefined,
				// Link to parent using correct field name based on email type
				...(sourceEmail.emailType === 'template'
					? { templateTranslationParent: emailId }
					: { segmentTranslationParent: emailId })
			};

			const createdEmail = await mauticService.createEmail(emailData);

			if (createdEmail) {
				console.log(`Created translated email for ${language}: ID ${createdEmail.id}`);
				createdEmails.push({
					email: createdEmail,
					language
				});
			} else {
				console.error(`Failed to create translated email for ${language}`);
			}
		} catch (error) {
			console.error(`Error translating to ${language}:`, error);
			// Continue with other languages even if one fails
		}
	}

	return createdEmails;
}
