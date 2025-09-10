/*
 * Data Transformer – CSV data transformation and validation engine
 * ----------------------------------------------------------------
 * Handles transformation of parsed CSV data according to column specifications,
 * including validation, custom transforms, and output generation in various formats.
 */

import { ColumnSpec, MappedRow, ValidationError, ValidationResult, ValidationType, ValidationRule, CsvMapping, CsvDialect } from '../types.js';
import { PapaParser } from '../csv/papaParser.js';
import { limitString, stringFormat, debug } from '../helpers.js';
import { Csv } from '../csv/csv.js';
import { CsvRow } from '../csv/row.js';

export interface TransformOptions {
  /** Whether to generate remapped CSV output */
  generateCsv?: boolean;
  /** Output CSV dialect (null to inherit from input) */
  outputSeparator?: string | null;
  outputEnclosure?: string | null;
  outputEscape?: string | null;
  /** Whether to include validation errors in output */
  includeErrors?: boolean;
}

export interface TransformResult {
  /** Transformed and mapped data rows */
  mappedRows: MappedRow[];
  /** Generated CSV string (if requested) */
  csv: string | null;
  /** Validation summary */
  validation: ValidationResult;
}

export class DataTransformer extends EventTarget {
  private options: Required<TransformOptions>;

  constructor(options: TransformOptions = {}) {
    super();
    this.options = {
      generateCsv: options.generateCsv ?? true,
      outputSeparator: options.outputSeparator ?? null,
      outputEnclosure: options.outputEnclosure ?? null,
      outputEscape: options.outputEscape ?? null,
      includeErrors: options.includeErrors ?? true
    };
  }

  /**
   * Transform raw CSV data according to column specifications and mapping
   * @param inputCsv Input CSV data
   * @param mapping Source header to target column mapping
   * @param columnSpecs Target column specifications
   * @returns Transformation result with mapped data and optional CSV
   */
  transform(
    inputCsv: Csv,
    mapping: Record<string, string>,
    columnSpecs: ColumnSpec[]
  ): TransformResult {
    // Validate required columns are mapped
    const missingRequired = this.validateRequiredMapping(mapping, columnSpecs);
    if (missingRequired.length > 0) {
      throw new Error(`Required columns are not mapped: ${missingRequired.join(', ')}`);
    }

    // Build target-to-source mapping
    const targetToSource = this.buildTargetMapping(mapping, columnSpecs);

    // Handle empty mapping case
    if (Object.keys(targetToSource).length === 0 && !columnSpecs.some(c => c.required)) {
      return this.handleEmptyMapping(inputCsv, columnSpecs);
    }

    // Transform rows
    const mappedRows = this.transformRows(inputCsv, targetToSource, columnSpecs);

    // Generate CSV if requested (simple format only)
    let csv: string | null = null;
    if (this.options.generateCsv) {
      csv = this.generateCsv(mappedRows, columnSpecs);
    }

    // Calculate validation summary
    const validation = this.calculateValidationSummary(mappedRows);
    if (!this.options.includeErrors) {
      mappedRows.forEach(row => {
        delete row.__errors__;
      });
    }

    return { mappedRows, csv, validation };
  }

  /**
   * Transform individual rows according to column specifications
   * @param inputCsv Source data rows
   * @param targetToSource Target column to source headers mapping
   * @param columnSpecs Column specifications
   * @returns Transformed rows with validation errors
   */
  private transformRows(
    inputCsv: Csv,
    targetToSource: Record<string, string[]>,
    columnSpecs: ColumnSpec[]
  ): MappedRow[] {
    const mappedRows: MappedRow[] = [];

    let rowIndex = 0;
    for (const sourceRow of inputCsv) {
      const mappedRow: MappedRow = {};

      // Process each target column
      for (const spec of columnSpecs) {
        const sourceHeaders = targetToSource[spec.name] || [];
        let value = '';

        // Find first non-empty value from mapped source columns
        for (const header of sourceHeaders) {
          const sourceValue = sourceRow.get(header);
          if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
            value = sourceValue;
            break;
          }
        }

        // Apply default value if no source value found
        if (!value && typeof spec.defaultValue !== 'undefined') {
          value = spec.defaultValue;
        }

        // Apply custom transformation if specified
        let transformedValue = value;
        if (spec.transform && typeof spec.transform === 'function') {
          try {
            const rowObject: Record<string, any> = {};
            if (inputCsv.headers) {
              inputCsv.headers.forEach(header => {
                rowObject[header] = sourceRow.get(header) || '';
              });
            }
            transformedValue = spec.transform(value, rowObject);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this._transformationError(rowIndex, spec.title || spec.name, transformedValue, msg);
            continue;
          }
        }

        // Validate the transformed value
        if (spec.validate !== undefined) {
          const isValid = DataTransformer.validateValue(transformedValue, spec.validate);
          if (!isValid) {
            let message: string;
            if (typeof spec.validate === 'object' && spec.validate !== null && 'type' in spec.validate) {
              message = `Value "${transformedValue}" is not a valid ${spec.validate.type}`;
            } else if (spec.validate instanceof RegExp) {
              message = `Value "${transformedValue}" does not match pattern ${spec.validate}`;
            } else if (typeof spec.validate === 'function') {
              message = `Value "${transformedValue}" failed custom validation`;
            } else {
              message = `Value "${transformedValue}" is invalid`;
            }
            
            if (spec.validationMessage) {
              message = spec.validationMessage;
            }
            
            const result = this._valueValidationError(rowIndex, spec.title || spec.name, transformedValue, message);
            if (result) {
              transformedValue = result;
            }
          }
        }

        mappedRow[spec.name] = transformedValue;
      }

      mappedRows.push(mappedRow);
      rowIndex++;
    }

    return mappedRows;
  }

  /**
   * Generate CSV output from transformed data
   * @param mappedRows Transformed data rows
   * @param columnSpecs Column specifications
   * @returns CSV string
   */
  private generateCsv(
    mappedRows: MappedRow[],
    columnSpecs: ColumnSpec[]
  ): string {
    const outSep = this.options.outputSeparator ?? ',';
    const outQuote = this.options.outputEnclosure ?? '"';
    const outEsc = this.options.outputEscape ?? null;

    // Simple CSV generation: use column specs directly
    const headerRow = columnSpecs.map(col => col.title || col.name);
    const lines = [DataTransformer.toCsvRow(headerRow, outSep, outQuote, outEsc)];
    
    // Add data rows
    for (const row of mappedRows) {
      const values = columnSpecs.map(col => row[col.name] ?? '');
      lines.push(DataTransformer.toCsvRow(values, outSep, outQuote, outEsc));
    }

    return lines.join('\n');
  }

  /**
   * Handle case where no columns are mapped but none are required
   * @param inputCsv Source data rows
   * @param columnSpecs Column specifications
   * @returns Transform result with empty mapped columns
   */
  private handleEmptyMapping(
    inputCsv: Csv,
    columnSpecs: ColumnSpec[]
  ): TransformResult {
    const mappedRows: MappedRow[] = [];

    // Create empty rows for each input row
    for (let i = 0; i < inputCsv.length; i++) {
      const row: MappedRow = {};
      for (const spec of columnSpecs) {
        row[spec.name] = '';
      }
      mappedRows.push(row);
    }

    let csv: string | null = null;
    if (this.options.generateCsv) {
      csv = this.generateCsv(mappedRows, columnSpecs);
    }

    const validation = this.calculateValidationSummary(mappedRows);
    if (!this.options.includeErrors) {
      mappedRows.forEach(row => {
        delete row.__errors__;
      });
    }
    return { mappedRows, csv, validation };
  }

  /**
   * Build mapping from target columns to source headers
   * @param mapping Source to target mapping
   * @param columnSpecs Column specifications
   * @returns Target to source array mapping
   */
  private buildTargetMapping(mapping: Record<string, string>, columnSpecs: ColumnSpec[]): Record<string, string[]> {
    const targetToSource: Record<string, string[]> = {};

    for (const [source, target] of Object.entries(mapping)) {
      if (targetToSource[target]) {
        targetToSource[target].push(source);
      } else {
        targetToSource[target] = [source];
      }
    }

    return targetToSource;
  }

  /**
   * Validate that all required columns are mapped
   * @param mapping Source to target mapping
   * @param columnSpecs Column specifications
   * @returns Array of missing required column names
   */
  private validateRequiredMapping(mapping: Record<string, string>, columnSpecs: ColumnSpec[]): string[] {
    const mappedTargets = new Set(Object.values(mapping));
    const missingRequired: string[] = [];

    for (const spec of columnSpecs) {
      if (spec.required && !mappedTargets.has(spec.name) && typeof spec.defaultValue === 'undefined') {
        missingRequired.push(spec.name);
      }
    }

    return missingRequired;
  }

  /**
   * Calculate validation summary from transformed rows
   * @param mappedRows Transformed data rows
   * @returns Validation result summary
   */
  private calculateValidationSummary(mappedRows: MappedRow[]): ValidationResult {
    const errors: ValidationError[] = [];
    let errorsByField: Record<string, number> = {};

    mappedRows.forEach((row, index) => {
      if (row.__errors__ && Array.isArray(row.__errors__)) {
        row.__errors__.forEach((error: ValidationError) => {
          errors.push(error);
          const field = error.field || 'unknown';
          errorsByField[field] = (errorsByField[field] || 0) + 1;
        });
      }
    });

    return {
      errors,
      totalRows: mappedRows.length,
      errorRows: errors.length,
      totalErrors: errors.length,
      errorsByField
    };
  }

  /**
   * Validate a single value against various validation types
   * @param fieldValue Value to validate
   * @param validator Validation rule
   * @returns True if valid, false otherwise
   */
  static validateValue(fieldValue: any, validator: RegExp | ((value: any) => boolean) | ValidationRule): boolean {
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      return true; // Empty values are considered valid unless required
    }

    if (validator instanceof RegExp) {
      return DataTransformer._validateRegex(fieldValue, validator);
    }

    if (typeof validator === 'function') {
      try {
        return validator(fieldValue);
      } catch (error) {
        return false;
      }
    }

    if (typeof validator === 'object' && validator !== null) {
      const rule = validator as ValidationRule;
      // Handle ValidationRule based on its type
      switch (rule.type) {
        case 'email':
          return DataTransformer._validateRegex(fieldValue, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
        case 'number':
          const num = Number(fieldValue);
          if (isNaN(num) || !isFinite(num)) return false;
          if (rule.min !== undefined && num < rule.min) return false;
          if (rule.max !== undefined && num > rule.max) return false;
          return true;
        case 'boolean':
          return ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(String(fieldValue).toLowerCase());
        case 'date':
          if (rule.format) {
            const regex = DataTransformer.dateFormatToRegex(rule.format);
            return regex.test(String(fieldValue));
          }
          return !isNaN(Date.parse(fieldValue));
        case 'phone':
        case 'tel':
        case 'telephone':
          return DataTransformer._validateRegex(fieldValue, /^[\+]?[\d\s\-\(\)\.]{7,15}$/);
        case 'time':
          return DataTransformer._validateRegex(fieldValue, /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/);
        case 'datetime':
          return !isNaN(Date.parse(fieldValue));
        default:
          return true;
      }
    }

    return true;
  }

  /**
   * Convert date format string to RegExp for validation
   * @param format Date format string (e.g., 'YYYY-MM-DD')
   * @param options Validation options
   * @returns RegExp for validation
   */
  static dateFormatToRegex(format:string, {
    allowSeparators = true,
    strictLength = false
  } = {}): RegExp {
    // Common format mappings
    const patterns: Record<string, string> = {
      'YYYY': '\\d{4}',
      'YY': '\\d{2}',
      'MM': '\\d{1,2}',
      'DD': '\\d{1,2}',
      'HH': '\\d{1,2}',
      'mm': '\\d{1,2}',
      'ss': '\\d{1,2}'
    };

    if (strictLength) {
      patterns['MM'] = '\\d{2}';
      patterns['DD'] = '\\d{2}';
      patterns['HH'] = '\\d{2}';
      patterns['mm'] = '\\d{2}';
      patterns['ss'] = '\\d{2}';
    }

    let regex = format;
    
    // Replace format tokens with regex patterns
    for (const [token, pattern] of Object.entries(patterns)) {
      regex = regex.replace(new RegExp(token, 'g'), pattern);
    }

    // Handle separators
    if (allowSeparators) {
      regex = regex.replace(/[-\/\.\s:]/g, '[-\\/\\.\\s:]');
    }

    return new RegExp(`^${regex}$`);
  }

  /**
   * Validate value against regex pattern
   * @param value Value to validate
   * @param regex Regular expression pattern
   * @returns True if valid, false otherwise
   */
  static _validateRegex(value: any, regex: RegExp): boolean {
    return regex.test(String(value));
  }

  /**
   * Update transformer options
   * @param options Partial options to update
   */
  updateOptions(options: Partial<TransformOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current transformer options
   * @returns Current options
   */
  getOptions(): TransformOptions {
    return { ...this.options };
  }

  /**
   * Convert array of values to CSV row string
   * @param arr Values to convert
   * @param sep Field separator
   * @param quote Quote character
   * @param esc Escape character
   * @returns CSV row string
   */
  static toCsvRow(arr: any[], sep: string = ',', quote: string = '"', esc: string | null = null): string {
    return arr.map(v => {
      const str = String(v ?? '');
      if (str.includes(sep) || str.includes(quote) || str.includes('\n') || str.includes('\r')) {
        const escaped = esc ? str.replace(new RegExp(quote, 'g'), esc + quote) : str.replace(new RegExp(quote, 'g'), quote + quote);
        return quote + escaped + quote;
      }
      return str;
    }).join(sep);
  }

  /**
   * Handle transformation errors
   * @param rowIndex Row index where error occurred
   * @param columnName Column name where error occurred
   * @param value Value that caused the error
   * @param message Error message
   */
  private _transformationError(rowIndex: number, columnName: string, value: any, message: string): void {
    this.dispatchEvent(new CustomEvent('transformationError', {
      detail: { rowIndex, columnName, value, message }
    }));
  }

  /**
   * Handle value validation errors
   * @param rowIndex Row index where error occurred
   * @param columnName Column name where error occurred
   * @param value Value that failed validation
   * @param message Error message
   * @returns Corrected value if any, otherwise original value
   */
  private _valueValidationError(rowIndex: number, columnName: string, value: any, message: string): any {
    const event = new CustomEvent('valueValidationError', {
      detail: { rowIndex, columnName, value, message }
    });
    this.dispatchEvent(event);
    return value; // Return original value by default
  }
}
