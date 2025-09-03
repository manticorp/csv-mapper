export interface CsvDialect {
    separator: string;
    enclosure: string;
    escape: string | null;
}
export interface ColumnSpec {
    name: string;
    title?: string;
    required?: boolean;
    allowDuplicates?: boolean;
    match?: RegExp | ((header: string) => boolean);
    transform?: (value: any, row: Record<string, any>) => any;
    validate?: RegExp | ((value: any) => boolean) | ValidationRule;
    validationMessage?: string;
}
export interface ValidationRule {
    type: 'number' | 'boolean';
    min?: number;
    max?: number;
}
export interface CsvMapperOptions {
    separator?: string;
    enclosure?: string;
    escape?: string;
    guessMaxLines?: number;
    outputSeparator?: string | null;
    outputEnclosure?: string | null;
    outputEscape?: string | null;
    headers?: boolean;
    remap?: boolean;
    showUserControls?: boolean;
    mappingInput?: HTMLElement | string | null;
    controlsContainer?: HTMLElement | string | null;
    columns?: (string | ColumnSpec)[];
    autoThreshold?: number;
    allowUnmappedTargets?: boolean;
    beforeParse?: ((text: string) => string | void) | null;
    beforeMap?: ((rows: Record<string, any>[]) => Record<string, any>[] | void) | null;
    afterMap?: ((rows: Record<string, any>[], csv: string | null) => void) | null;
}
export interface ParseOptions {
    headers?: boolean;
    separator?: string;
    enclosure?: string;
    escape?: string;
    guessMaxLines?: number;
}
export interface ParseResult {
    headers: string[];
    rows: Record<string, any>[];
    dialect: CsvDialect;
}
export interface DetectDialectOptions {
    separator?: string | null | undefined;
    enclosure?: string | null | undefined;
    escape?: string | null | undefined;
    guessMaxLines?: number;
}
export interface MappedOutput {
    mappedRows: MappedRow[];
    csv: string | null;
}
export interface MappedRow extends Record<string, any> {
    __errors__?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    value: any;
}
export default class CsvMapper extends EventTarget {
    input: HTMLInputElement;
    opts: CsvMapperOptions;
    columns: ColumnSpec[];
    controlsEl: HTMLElement | null;
    mapping: Record<string, string>;
    headers: string[];
    rows: MappedRow[];
    dialect: CsvDialect;
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
//# sourceMappingURL=csv-mapper.d.ts.map