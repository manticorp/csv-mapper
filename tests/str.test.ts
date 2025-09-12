import Str from "../src/str";

describe('normalize', () => {
    test('upper', () => {
        expect(Str.upper('hello world')).toBe('HELLO WORLD');
        expect(Str.upper('HELLO WORLD')).toBe('HELLO WORLD');
    });
    test('lower', () => {
        expect(Str.lower('HELLO WORLD')).toBe('hello world');
        expect(Str.lower('hello world')).toBe('hello world');
    });
    test('snakeCase', () => {
        expect(Str.snakeCase('HELLO WORLD')).toBe('hello_world');
        expect(Str.snakeCase('hello world')).toBe('hello_world');
    });
    test('screamingSnakeCase', () => {
        expect(Str.screamingSnakeCase('HELLO WORLD')).toBe('HELLO_WORLD');
        expect(Str.screamingSnakeCase('hello world')).toBe('HELLO_WORLD');
    });
    test('titleCase', () => {
        expect(Str.titleCase('HELLO WORLD')).toBe('Hello World');
        expect(Str.titleCase('hello world')).toBe('Hello World');
    });
    test('pascalCase', () => {
        expect(Str.pascalCase('HELLO WORLD')).toBe('HelloWorld');
        expect(Str.pascalCase('hello world')).toBe('HelloWorld');
    });
    test('camelCase', () => {
        expect(Str.camelCase('HELLO WORLD')).toBe('helloWorld');
        expect(Str.camelCase('hello world')).toBe('helloWorld');
    });
    test('kebabCase', () => {
        expect(Str.kebabCase('HELLO WORLD')).toBe('hello-world');
        expect(Str.kebabCase('hello world')).toBe('hello-world');
    });
});