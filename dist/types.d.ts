import { Csv } from "./csv/csv";
import { CsvRow } from "./csv/row";
import { TransformOptions } from "./transform/defaultDataTransformer";
/**
 * @expand
 */
export interface CsvDialect {
    separator: string;
    enclosure: string;
    escape: string | null;
}
export type CsvMapping = Record<string, string | string[]>;
export type TransformFunction = (value: any, row: number, column: string | number, spec: ColumnSpec) => any;
export type TransformType = 'number' | 'boolean' | 'date' | 'string' | 'uppercase' | 'lowercase' | 'trim' | 'ascii' | 'kebab' | 'snake' | 'screaming_snake' | 'title' | 'pascal' | 'camel';
export interface TransformRule {
    type: TransformType | TransformType[];
    format?: string | TransformFunction;
}
export type ValidationType = 'number' | 'boolean' | 'email' | 'phone' | 'tel' | 'telephone' | 'date' | 'time' | 'datetime';
export interface ValidationRule {
    type: ValidationType;
    min?: number;
    max?: number;
    format?: string;
}
export interface ColumnSpec {
    /** The name of the column. Is the default value for the UI title and output header */
    name: string;
    /** The title of the column. Used for the UI. */
    title?: string;
    /** Description of the column. Used for the UI as a tooltip. */
    description?: string;
    /** A comment that appears under the select in the UI */
    comment?: string;
    /** The header name to use for the output CSV. */
    outputHeader?: string;
    defaultValue?: any;
    required?: boolean;
    allowDuplicates?: boolean;
    match?: RegExp | ((header: string) => boolean);
    transform?: TransformRule | TransformType | (TransformType | TransformFunction)[] | TransformFunction;
    validate?: ValidationType | RegExp | ((value: any) => boolean) | ValidationRule;
    validationMessage?: string;
}
/**
 * @expand
 */
export interface RequiredColumnValidationResult {
    isValid: boolean;
    missingRequired: string[];
    mappedTargets: string[];
}
/**
 * @expand
 */
export interface MappingResult {
    isValid: boolean;
    missingRequired: string[];
    mappedColumns: string[];
}
/**
 * @expand
 */
export interface MappedOutput {
    data: Csv;
    csv: string;
    validation: ValidationResult;
}
export interface ValidationError {
    row: CsvRow;
    rowIndex: number;
    field: string;
    message: string;
    value: any;
}
/**
 * @expand
 */
export interface ValidationResult {
    errors: ValidationError[];
    totalRows: number;
    errorRows: number;
    totalErrors: number;
    errorsByField: Record<string, number>;
}
export interface ParseOptions {
    headers?: boolean;
    delimiter?: string;
    quoteChar?: string;
    escapeChar?: string;
    guessMaxLines?: number;
}
/**
 * @expand
 */
export interface ParseResult {
    headers: string[];
    rows: Record<string, any>[];
    rawRows: string[][];
    dialect: CsvDialect;
}
export interface DetectDialectOptions {
    delimiter?: string | null | undefined;
    quoteChar?: string | null | undefined;
    escapeChar?: string | null | undefined;
    guessMaxLines?: number;
}
export interface CsvParser {
    /**
     * Parse CSV text with auto-detection or explicit dialect options
     * @param text CSV text to parse
     * @param options Parsing options including dialect preferences
     * @returns Parsed result with headers, rows, and detected dialect
     */
    parseCSV(text: string, options?: ParseOptions): ParseResult;
    /**
     * Detect CSV dialect (separator, enclosure, escape) from sample text
     * @param text CSV text to analyze
     * @param options Dialect detection options
     * @returns Detected CSV dialect
     */
    detectDialect(text: string, options?: DetectDialectOptions): CsvDialect;
    /**
     * Convert array of values to CSV row string
     * @param arr Array of values to convert
     * @param sep Field separator (default: comma)
     * @param quote Enclosure character (default: double quote)
     * @param esc Escape character (null for quote doubling)
     * @returns CSV row string
     */
    toCsvRow(arr: any[], sep?: string, quote?: string, esc?: string | null): string;
}
export interface UIRenderOptions {
    headers: string[];
    columnSpecs: ColumnSpec[];
    currentMapping: Record<string, string>;
    fullMapping: Record<string, string | string[]>;
    mappingResult: MappingResult;
    validation: ValidationResult;
    rowCount: number;
    dialect: CsvDialect;
    mappingMode: MappingMode;
    allowMultipleSelection?: boolean;
}
export interface DataTransformer extends EventTarget {
    transform(inputCsv: Csv, mapping: CsvMapping, columnSpecs: ColumnSpec[]): MappedOutput;
}
export interface UIRenderer {
    /**
     * Render the mapping interface
     */
    render(container: HTMLElement, options: UIRenderOptions): void;
    /**
     * Set up event listeners for mapping changes
     */
    onMappingChange(callback: (sourceHeader: string, targetColumn: string | string[]) => CsvMapping): void;
    /**
     * Update the validation display
     */
    updateMapping(validation: MappingResult): void;
    /**
     * Clean up resources when destroyed
     */
    destroy(): void;
    /**
     * Call reset to definitely redraw all next time.
     */
    reset(): void;
    /**
     * Show a message/banner (optional)
     */
    showMessage?(message: string): void;
}
export type MappingMode = 'csvToConfig' | 'configToCsv';
export type UIRendererOption = 'default';
export interface CsvMapperOptions {
    /**
     * The column specification.
     */
    columns?: (string | ColumnSpec)[];
    /** Whether the input will have headers */
    headers?: boolean;
    /** The input delimiter - leave blank for auto detect */
    delimiter?: string;
    /** The input quote char - leave blank for auto detect */
    quoteChar?: string;
    /** The input escape char - leave blank for auto detect */
    escapeChar?: string;
    /** CSV output formatting options. */
    output?: Partial<TransformOptions>;
    /** Whether to remap the output CSV and intercept the file input. */
    remap?: boolean;
    /**
     * Whether to show the user remapping UI. Defaults to true
     * if input is passed or false otherwise.
     */
    showUserControls?: boolean;
    /**
     * A html element or selector whose value will be set to a JSON
     * representation of the mapping. This can be used if you want to
     * pass the mapping on to your server for later use.
     */
    mappingInput?: HTMLElement | string | null;
    /**
     * A html element or selector where the user controls will be rendered.
     * If not given and showUserControls is true, the controls will be
     * rendered after the file input. If given as a selector and no element
     * is found, the controls will not be rendered.
     */
    controlsContainer?: HTMLElement | string | null;
    /** Similarity threshold for auto column mapping. */
    autoThreshold?: number;
    /** Whether to set the input element's validity state on mapping/parse/validation errors. */
    setInputValidity?: boolean;
    /** Mapping mode (csvToConfig or configToCsv) - defaults to csvToConfig. */
    mappingMode?: MappingMode;
    /** Whether to allow an input CSV column to be mapped multiple times. */
    allowMultipleSelection?: boolean;
    /** CSV Parser so custom parsers can be implemented. */
    parser?: CsvParser | null;
    /** UI Renderer so custom UI can be implemented. */
    uiRenderer?: UIRenderer | UIRendererOption | null;
    /** Data transformer and validator */
    transformer?: DataTransformer;
}
//# sourceMappingURL=types.d.ts.map