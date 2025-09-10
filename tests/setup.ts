// Jest setup file
// Mock DOM APIs that might be missing in jsdom

// Mock file input for testing
Object.defineProperty(window, 'HTMLInputElement', {
  value: class MockHTMLInputElement {
    type = 'file';
    files = null;
    value = '';

    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    setCustomValidity = jest.fn();
    reportValidity = jest.fn();
    insertAdjacentElement = jest.fn();
  }
});

// Mock document.querySelector
Object.defineProperty(document, 'querySelector', {
  value: jest.fn((selector: string) => {
    if (selector === '#test-input') {
      return new (window as any).HTMLInputElement();
    }
    return null;
  })
});

// Mock document.createElement with proper typing
const originalCreateElement = document.createElement.bind(document);
(document as any).createElement = jest.fn((tagName: string) => {
  if (tagName === 'div') {
    return {
      dataset: {},
      insertAdjacentElement: jest.fn(),
      remove: jest.fn(),
      innerHTML: '',
      style: {}
    } as any;
  }
  return originalCreateElement(tagName);
});

// Suppress console warnings in tests unless specifically testing them
const originalWarn = console.warn;
console.warn = jest.fn((...args: any[]) => {
  // Only show warnings in tests if they contain 'test' in the message
  if (args.some(arg => typeof arg === 'string' && arg.includes('test'))) {
    originalWarn(...args);
  }
});
