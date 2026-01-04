/**
 * OpenAI Service
 * Handles translation and AI operations using OpenAI API
 *
 * @see MA07-Email-Translations-Route.md
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY, OPENAI_MODEL } from '$env/static/private';

// Language code to full name mapping
const LANGUAGE_NAMES: Record<string, string> = {
	en: 'English',
	es: 'Spanish',
	fr: 'French',
	de: 'German',
	it: 'Italian',
	pt: 'Portuguese',
	hi: 'Hindi',
	ar: 'Arabic',
	ru: 'Russian',
	ur: 'Urdu',
	fi: 'Finnish',
	nb: 'Norwegian Bokmål'
};

/**
 * OpenAI Service Class
 * Provides translation capabilities using GPT models
 */
class OpenAIService {
	private client: OpenAI | null = null;
	private initialized: boolean = false;
	private model: string;

	constructor() {
		const apiKey = OPENAI_API_KEY;
		this.model = OPENAI_MODEL || 'gpt-4o-mini';

		if (!apiKey) {
			console.warn(
				'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.'
			);
			this.initialized = false;
			return;
		}

		this.client = new OpenAI({ apiKey });
		this.initialized = true;
	}

	/**
	 * Check if OpenAI service is properly initialized
	 */
	public isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Get full language name from code
	 */
	private getLanguageName(code: string): string {
		return LANGUAGE_NAMES[code] || code;
	}

	/**
	 * Translate an array of text segments to a target language
	 * @param segments Array of text segments to translate
	 * @param targetLanguage Target language code (e.g., 'es', 'fr')
	 * @param preserveTokens Whether to preserve Mautic tokens like {contactfield=firstname}
	 */
	public async translateSegments(
		segments: string[],
		targetLanguage: string,
		preserveTokens: boolean = true
	): Promise<string[]> {
		if (!this.initialized || !this.client) {
			console.warn('OpenAI service not initialized, returning original segments');
			return segments;
		}

		if (segments.length === 0) {
			return [];
		}

		const languageName = this.getLanguageName(targetLanguage);

		// Build system prompt
		const systemPrompt = `You are a professional translator. Translate the following text segments to ${languageName} (${targetLanguage}).

IMPORTANT RULES:
1. Preserve ALL HTML tags exactly as they appear
2. DO NOT create new tags or remove existing ones
3. Maintain Mautic personalization tokens like {contactfield=firstname}, {unsubscribe_url}, {signature} EXACTLY as they appear
4. Keep URLs unchanged
5. Preserve line breaks and formatting
6. Translate naturally while maintaining the original meaning and tone
7. For email content, keep a professional but friendly tone
8. Return ONLY the translated text, no explanations

The segments are separated by "---SEGMENT---". Return translations in the same order, separated by the same delimiter.`;

		// Join segments with delimiter
		const userPrompt = segments.join('\n---SEGMENT---\n');

		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.3, // Lower temperature for more consistent translations
				max_tokens: 4096
			});

			const translatedText = response.choices[0]?.message?.content || '';

			// Split back into segments
			const translatedSegments = translatedText.split(/\n?---SEGMENT---\n?/);

			// Ensure we have the same number of segments
			if (translatedSegments.length !== segments.length) {
				console.warn(
					`Translation segment count mismatch: expected ${segments.length}, got ${translatedSegments.length}`
				);
				// Pad with original segments if needed
				while (translatedSegments.length < segments.length) {
					translatedSegments.push(segments[translatedSegments.length]);
				}
			}

			return translatedSegments.map((s) => s.trim());
		} catch (error) {
			console.error('OpenAI translation error:', error);
			return segments; // Return original on error
		}
	}

	/**
	 * Translate a single text string
	 * @param text Text to translate
	 * @param targetLanguage Target language code
	 * @param context Optional context for better translation
	 */
	public async translateSingle(
		text: string,
		targetLanguage: string,
		context?: string
	): Promise<string> {
		if (!this.initialized || !this.client) {
			console.warn('OpenAI service not initialized, returning original text');
			return text;
		}

		const languageName = this.getLanguageName(targetLanguage);

		const systemPrompt = `You are a professional translator. Translate the following text to ${languageName} (${targetLanguage}).
${context ? `Context: ${context}` : ''}

IMPORTANT RULES:
1. Preserve Mautic personalization tokens like {contactfield=firstname} EXACTLY as they appear
2. Keep URLs unchanged
3. Translate naturally while maintaining the original meaning and tone
4. Return ONLY the translated text, no explanations`;

		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: text }
				],
				temperature: 0.3,
				max_tokens: 1024
			});

			return response.choices[0]?.message?.content?.trim() || text;
		} catch (error) {
			console.error('OpenAI translation error:', error);
			return text;
		}
	}
}

// Export singleton instance
const openAIService = new OpenAIService();
export default openAIService;

// Also export class for testing purposes
export { OpenAIService };
