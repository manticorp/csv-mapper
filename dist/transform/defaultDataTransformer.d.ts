import { ColumnSpec, MappedOutput, ValidationRule, CsvMapping, DataTransformer } from '../types.js';
import { Csv } from '../csv/csv.js';
export interface TransformOptions {
    /** Delimiter to use for output */
    delimiter?: string;
    /** Quote Char to use for output */
    quoteChar?: string;
    /** Escape Char to use for output */
    escapeChar?: string;
    /** Newline character to use for output */
    newline?: string;
    /** Whether to allow columns from the input CSV that aren't mapped in the output */
    allowUnmappedTargets: boolean;
    /**
     * Function for transforming type="date" columns.
     * Can accept a date format string (e.g. "YYYY-MM-DD", or "iso8601")
     * Uses built in best guess otherwise.
     */
    dateFormatter?: string | ((value: string) => string);
    /**
     * Function for transforming type="date" columns.
     * Otherwise, transforms all truthy values to 1 and falsy values to 0.
     */
    booleanFormatter?: {
        true: string;
        false: string;
    } | ((value: string) => string);
}
export declare class DefaultDataTransformer extends EventTarget implements DataTransformer {
    private options;
    constructor(options?: Partial<TransformOptions>);
    /**
     * Transform raw CSV data according to column specifications and mapping
     * @param inputCsv Input CSV data
     * @param mapping Source header to target column mapping
     * @param columnSpecs Target column specifications
     * @returns Transformation result with mapped data and optional CSV
     */
    transform(inputCsv: Csv, mapping: CsvMapping, columnSpecs: ColumnSpec[]): MappedOutput;
    private calculateValidationSummary;
    /**
     * Transform individual rows according to column specifications
     * @param inputCsv Source data rows
     * @param mapping Target column to source headers mapping
     * @param columnSpecs Column specifications
     * @returns Transformed rows with validation errors
     */
    private transformRows;
    private _guessBoolean;
    /**
     * Allows all numbers of the forms:
     * 1234
     * -1234
     * 1e10
     * -1E10
     * 1.234
     * -1.234
     * +1234
     * 1,234,567.89
     * -1,234,567.89
     * +1,234,567.89
     * 1 234 567.89 (space separators)
     * 1'234'567.89 (apostrophe separators)
     * 1_234_567.89 (underscore separators)
     * $1,234.56 (currency symbols)
     * €1.234,56 (European decimal comma)
     * 123% (percentages)
     * (123.45) (accounting negative)
     */
    private static _transformNumber;
    private _transformBoolean;
    private _transformDate;
    private _formatDateString;
    private _transformValue;
    /**
     * Generate CSV output from transformed data
     * @param mappedRows Transformed data rows
     * @param columnSpecs Column specifications
     * @returns CSV string
     */
    private generateCsv;
    /**
     * Handle case where no columns are mapped but none are required
     * @param inputCsv Source data rows
     * @param columnSpecs Column specifications
     * @returns Transform result with empty mapped columns
     */
    private handleEmptyMapping;
    /**
     * Validate that all required columns are mapped
     * @param mapping Source to target mapping
     * @param columnSpecs Column specifications
     * @returns Array of missing required column names
     */
    private validateRequiredMapping;
    getAllMappedTargets(mapping: CsvMapping): string[];
    /**
     * Validate a single value against various validation types
     * @param fieldValue Value to validate
     * @param validator Validation rule
     * @returns True if valid, false otherwise
     */
    static validateValue(fieldValue: any, validator: RegExp | ((value: any) => boolean) | ValidationRule): boolean;
    /**
     * Validate value against regex pattern
     * @param value Value to validate
     * @param regex Regular expression pattern
     * @returns True if valid, false otherwise
     */
    static _validateRegex(value: any, regex: RegExp): boolean;
    /**
     * Update transformer options
     * @param options Partial options to update
     */
    updateOptions(options: Partial<TransformOptions>): void;
    /**
     * Get current transformer options
     * @returns Current options
     */
    getOptions(): TransformOptions;
    /**
     * Convert array of values to CSV row string
     * @param arr Values to convert
     * @param sep Field separator
     * @param quote Quote character
     * @param esc Escape character
     * @returns CSV row string
     */
    static toCsvRow(arr: any[], sep?: string, quote?: string, esc?: string | null): string;
    /**
     * Handle transformation errors
     * @param rowIndex Row index where error occurred
     * @param columnName Column name where error occurred
     * @param value Value that caused the error
     * @param message Error message
     * @returns Boolean indicating whether result was nullified
     */
    private _transformationError;
    /**
     * Handle value validation errors
     * @param rowIndex Row index where error occurred
     * @param columnName Column name where error occurred
     * @param value Value that failed validation
     * @param message Error message
     * @returns Boolean indicating whether result was nullified
     */
    private _valueValidationError;
}
//# sourceMappingURL=defaultDataTransformer.d.ts.map