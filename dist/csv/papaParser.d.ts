import { CsvDialect, ParseOptions, ParseResult, DetectDialectOptions, CsvParser } from '../types.js';
export declare class PapaParser implements CsvParser {
    /**
     * Parse CSV text with auto-detection or explicit dialect options
     * @param text CSV text to parse
     * @param options Parsing options including dialect preferences
     * @returns Parsed result with headers, rows, and detected dialect
     */
    parseCSV(text: string, { headers, separator, enclosure, escape, guessMaxLines }?: ParseOptions): ParseResult;
    /**
     * Detect CSV dialect (separator, enclosure, escape) from sample text
     * @param text CSV text to analyze
     * @param options Dialect detection options
     * @returns Detected CSV dialect
     */
    detectDialect(text: string, { separator, enclosure, escape, guessMaxLines }?: DetectDialectOptions): CsvDialect;
    /**
     * Convert array of values to CSV row string
     * @param arr Array of values to convert
     * @param sep Field separator (default: comma)
     * @param quote Enclosure character (default: double quote)
     * @param esc Escape character (null for quote doubling)
     * @returns CSV row string
     */
    toCsvRow(arr: any[], sep?: string, quote?: string, esc?: string | null): string;
    /**
     * Parse CSV text with a specific dialect
     * @param text CSV text to parse
     * @param sep Field separator character
     * @param quote Enclosure/quote character
     * @param esc Escape character (null for quote doubling)
     * @returns Array of string arrays (raw CSV rows)
     */
    _parseWithDialect(text: string, sep: string, quote: string, esc: string | null): string[][];
    /**
     * Get a sample of text containing up to maxRows logical CSV rows
     * For PapaParse, we can just use a simple line-based approach since
     * PapaParse handles the complex parsing internally
     */
    _getSampleText(text: string, maxRows: number): string;
    _mode(arr: number[]): number | null;
    _escRe(s: string): string;
}
//# sourceMappingURL=papaParser.d.ts.map