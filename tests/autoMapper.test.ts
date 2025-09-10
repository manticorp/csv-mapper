import { AutoMapper } from "../src/transform/autoMapper";

describe('similarity', () => {
    test('should calculate string similarity', () => {
        expect(AutoMapper.similarity('test', 'test')).toBe(1); // Identical
        expect(AutoMapper.similarity('test', 'TEST')).toBe(1); // Case insensitive
        expect(AutoMapper.similarity('test', 'testing')).toBeGreaterThan(0.5);
        expect(AutoMapper.similarity('test', 'completely different')).toBeLessThan(0.3);
    });

    test('should handle empty strings', () => {
        expect(AutoMapper.similarity('', '')).toBe(0);
        expect(AutoMapper.similarity('test', '')).toBe(0);
        expect(AutoMapper.similarity('', 'test')).toBe(0);
    });

    test('should normalize before comparison', () => {
        expect(AutoMapper.similarity('first_name', 'First Name')).toBeGreaterThan(0.8);
        expect(AutoMapper.similarity('user-email', 'User Email')).toBeGreaterThan(0.8);
    });
});