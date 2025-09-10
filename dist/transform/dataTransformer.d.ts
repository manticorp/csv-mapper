import { ColumnSpec, MappedOutput, ValidationRule, CsvMapping } from '../types.js';
import { Csv } from '../csv/csv.js';
export interface TransformOptions {
    /** Whether to generate remapped CSV output */
    generateCsv: boolean;
    /** Output CSV dialect (null to inherit from input) */
    delimiter?: string;
    quoteChar?: string;
    escapeChar?: string;
    newline?: string;
    /** Whether to include validation errors in output */
    includeErrors: boolean;
}
export declare class DataTransformer extends EventTarget {
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
    private _invertMapping;
    /**
     * Transform individual rows according to column specifications
     * @param inputCsv Source data rows
     * @param mapping Target column to source headers mapping
     * @param columnSpecs Column specifications
     * @returns Transformed rows with validation errors
     */
    private transformRows;
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
     * Convert date format string to RegExp for validation
     * @param format Date format string (e.g., 'YYYY-MM-DD')
     * @param options Validation options
     * @returns RegExp for validation
     */
    static dateFormatToRegex(format: string, { allowSeparators, strictLength }?: {
        allowSeparators?: boolean | undefined;
        strictLength?: boolean | undefined;
    }): RegExp;
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
     */
    private _transformationError;
    /**
     * Handle value validation errors
     * @param rowIndex Row index where error occurred
     * @param columnName Column name where error occurred
     * @param value Value that failed validation
     * @param message Error message
     * @returns Corrected value if any, otherwise original value
     */
    private _valueValidationError;
}
//# sourceMappingURL=dataTransformer.d.ts.map