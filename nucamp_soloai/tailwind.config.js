import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Custom brand colors
				brand: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554'
				}
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'"Helvetica Neue"',
					'Arial',
					'"Noto Sans"',
					'sans-serif',
					'"Apple Color Emoji"',
					'"Segoe UI Emoji"',
					'"Segoe UI Symbol"',
					'"Noto Color Emoji"'
				],
				mono: [
					'"Fira Code"',
					'"JetBrains Mono"',
					'Menlo',
					'Monaco',
					'Consolas',
					'"Liberation Mono"',
					'"Courier New"',
					'monospace'
				]
			},
			typography: (theme) => ({
				DEFAULT: {
					css: {
						color: theme('colors.gray.700'),
						a: {
							color: theme('colors.blue.600'),
							'&:hover': {
								color: theme('colors.blue.700')
							}
						},
						h1: {
							color: theme('colors.gray.900')
						},
						h2: {
							color: theme('colors.gray.900')
						},
						h3: {
							color: theme('colors.gray.900')
						},
						h4: {
							color: theme('colors.gray.900')
						}
					}
				}
			})
		}
	},
	plugins: [forms, typography, daisyui],
	daisyui: {
		themes: [
			{
				soloai: {
					primary: '#3b82f6',
					'primary-focus': '#2563eb',
					'primary-content': '#ffffff',

					secondary: '#8b5cf6',
					'secondary-focus': '#7c3aed',
					'secondary-content': '#ffffff',

					accent: '#10b981',
					'accent-focus': '#059669',
					'accent-content': '#ffffff',

					neutral: '#1f2937',
					'neutral-focus': '#111827',
					'neutral-content': '#f3f4f6',

					'base-100': '#ffffff',
					'base-200': '#f9fafb',
					'base-300': '#f3f4f6',
					'base-content': '#1f2937',

					info: '#3b82f6',
					'info-content': '#ffffff',

					success: '#10b981',
					'success-content': '#ffffff',

					warning: '#f59e0b',
					'warning-content': '#ffffff',

					error: '#ef4444',
					'error-content': '#ffffff'
				}
			},
			'light',
			'dark'
		],
		base: true,
		styled: true,
		utils: true,
		prefix: '',
		logs: true,
		themeRoot: ':root'
	}
};
