/**
 * Vitest Test Setup
 * (TS03-Vitest-Unit-Testing.md)
 *
 * Global test setup for unit tests.
 * Configures testing-library matchers and mocks common browser APIs.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs that aren't available in jsdom
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Reset all mocks after each test
afterEach(() => {
	vi.clearAllMocks();
	localStorageMock.getItem.mockReset();
	localStorageMock.setItem.mockReset();
	localStorageMock.removeItem.mockReset();
	localStorageMock.clear.mockReset();
});
