export declare function words(input: string): string[];
export declare const lower: (s: string) => string;
export declare const upper: (s: string) => string;
export declare const cap: (s: string) => string;
export declare function camelCase(str: string): string;
export declare function pascalCase(str: string): string;
export declare function titleCase(str: string, { smallWords }?: {
    smallWords?: boolean | undefined;
}): string;
/**
 * snake_case
 */
export declare function snakeCase(str: string): string;
/**
 * SCREAMING_SNAKE_CASE
 */
export declare function screamingSnakeCase(str: string): string;
/**
 * kebab-case
 */
export declare function kebabCase(str: string): string;
/**
 * Separate words with spaces
 */
export declare function separateWords(str: string): string;
/**
 * Separate words with spaces
 */
export declare function ascii(str: string): string;
declare const _default: {
    words: typeof words;
    lower: (s: string) => string;
    upper: (s: string) => string;
    cap: (s: string) => string;
    camelCase: typeof camelCase;
    pascalCase: typeof pascalCase;
    titleCase: typeof titleCase;
    snakeCase: typeof snakeCase;
    screamingSnakeCase: typeof screamingSnakeCase;
    kebabCase: typeof kebabCase;
    separateWords: typeof separateWords;
    ascii: typeof ascii;
};
export default _default;
//# sourceMappingURL=str.d.ts.map