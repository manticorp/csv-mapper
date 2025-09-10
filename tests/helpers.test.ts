import { normalize } from "../src/helpers";

describe('normalize', () => {
    test('should normalize strings', () => {
        expect(normalize('Full Name')).toBe('full name');
        expect(normalize('first_name')).toBe('first name');
        expect(normalize('user-email')).toBe('user email');
        expect(normalize('  MULTIPLE   SPACES  ')).toBe('multiple spaces');
    });

    test('should handle empty and null values', () => {
        expect(normalize('')).toBe('');
        expect(normalize(null)).toBe('');
        expect(normalize(undefined)).toBe('');
    });

    test('should convert non-strings', () => {
        expect(normalize(123)).toBe('123');
        expect(normalize(true)).toBe('true');
    });
});