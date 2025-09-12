// --- tiny tokenizer (Unicode-aware where supported) ---
const WORD_RE = (() => {
  try {
    // letters (with marks) or numbers
    return /\p{L}[\p{L}\p{M}\p{N}]*|\p{N}+/gu;
  } catch {
    // fallback for older JS engines
    return /[A-Za-z0-9]+/g;
  }
})();

export function words(input: string): string[] {
  const s = String(input)
    .trim()
    // unify common separators
    .replace(/[_\-.]+/g, ' ')
    // split camelCase and HTTPResponse -> HTTP Response
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return s.match(WORD_RE) || [];
}

export const lower = (s: string) => s.toLowerCase();
export const upper = (s: string) => s.toUpperCase();
export const cap   = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// --- case converters ---

export function camelCase(str: string): string {
  const w = words(str).map(lower);
  return w.map((t, i) => (i ? cap(t) : t)).join('');
}

export function pascalCase(str: string): string {
  return words(str).map(cap).join('');
}

export function titleCase(str: string, { smallWords = true } = {}): string {
  const small = new Set([
    'a','an','and','as','at','but','by','en','for','if','in',
    'of','on','or','the','to','vs','via'
  ]);
  const w = words(str);
  return w
    .map((t, i) =>
      smallWords && i > 0 && i < w.length - 1 && small.has(t.toLowerCase())
        ? t.toLowerCase()
        : cap(t)
    )
    .join(' ');
}

/**
 * snake_case
 */
export function snakeCase(str: string): string {
  return words(str).map(lower).join('_');
}

/**
 * SCREAMING_SNAKE_CASE
 */
export function screamingSnakeCase(str: string): string {
  return words(str).map(upper).join('_');
}

/**
 * kebab-case
 */
export function kebabCase(str: string): string {
  return words(str).map(lower).join('-');
}

/**
 * Separate words with spaces
 */
export function separateWords(str: string): string {
  // keeps natural capitalization (e.g., "XML HTTP Request")
  return words(str).join(' ');
}

/**
 * Separate words with spaces
 */
export function ascii(str: string): string {
  // convert accented characters to their ASCII equivalents
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default {
  words,
  lower,
  upper,
  cap,
  camelCase,
  pascalCase,
  titleCase,
  snakeCase,
  screamingSnakeCase,
  kebabCase,
  separateWords,
  ascii
};