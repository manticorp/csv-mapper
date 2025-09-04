import { CsvDialect, ColumnSpec, ValidationRule, CsvMapperOptions, ParseOptions, ParseResult, DetectDialectOptions, MappedOutput, MappedRow, UIRenderer } from './types.js';
export { DefaultUIRenderer } from './ui/renderer/default.js';
export { MinimalUIRenderer } from './ui/renderer/minimal.js';
export * from './types.js';
export default class CsvMapper extends EventTarget {
    input: HTMLInputElement;
    opts: CsvMapperOptions;
    columns: ColumnSpec[];
    controlsEl: HTMLElement | null;
    mapping: Record<string, string>;
    headers: string[];
    rows: MappedRow[];
    dialect: CsvDialect;
    uiRenderer: UIRenderer;
    /**
     * @param fileInput selector or element for <input type=file>
     * @param options configuration options
     */
    constructor(fileInput: HTMLInputElement | string, options?: CsvMapperOptions);
    destroy(): void;
    getMapping(): Record<string, string>;
    setMapping(map: Record<string, string> | null): void;
    getHeaders(): string[];
    getRawRows(): MappedRow[];
    getDialect(): CsvDialect;
    _validateMapping(): {
        isValid: boolean;
        missingRequired: string[];
    };
    _onMappingChange(): void;
    /**
     * Checks if all required columns are mapped
     * @returns Object with validation status and missing required columns
     */
    validateMapping(): {
        isValid: boolean;
        missingRequired: string[];
    };
    _onFileChange(): Promise<void>;
    /**
     * Validates that all required columns are mapped
     * @returns Array of missing required column names
     */
    _validateRequiredColumns(): string[];
    _produceOutput(): MappedOutput;
    _renderControls(): void;
    private _getValidationStatus;
    _banner(text: string): string;
    _autoMap(): void;
    _matchScore(srcHeader: string, spec: ColumnSpec): number;
    _resolveNode(ref: HTMLElement | string | null): HTMLElement | null;
    _autoinsertContainer(): HTMLDivElement | null;
    static parseCSV(text: string, { headers, separator, enclosure, escape, guessMaxLines }?: ParseOptions): ParseResult;
    static _parseWithDialect(text: string, sep: string, quote: string, esc: string | null): string[][];
    static detectDialect(text: string, { separator, enclosure, escape, guessMaxLines }?: DetectDialectOptions): CsvDialect;
    static _mode(arr: number[]): number | null;
    static _escRe(s: string): string;
    static toCsvRow(arr: any[], sep?: string, quote?: string, esc?: string | null): string;
    static normalize(s: any): string;
    static similarity(a: string, b: string): number;
    static _validate(v: any, validator: RegExp | ((value: any) => boolean) | ValidationRule): boolean;
    static _ensureStyles(): void;
    static escape(s: any): string;
}
//# sourceMappingURL=csvMapper.d.ts.map