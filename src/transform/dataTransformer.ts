/*
 * Data Transformer – CSV data transformation and validation engine
 * ----------------------------------------------------------------
 * Handles transformation of parsed CSV data according to column specifications,
 * including validation, custom transforms, and output generation in various formats.
 */

import { ColumnSpec, ValidationError, MappedOutput, ValidationResult, ValidationType, ValidationRule, CsvMapping, CsvDialect } from '../types.js';
import { PapaParser } from '../csv/papaParser.js';
import { limitString, stringFormat, debug, logger } from '../helpers.js';
import { Csv } from '../csv/csv.js';
import { CsvRow } from '../csv/row.js';

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

export class DataTransformer extends EventTarget {
  private options: TransformOptions;

  constructor(options: Partial<TransformOptions> = {}) {
    super();
    this.options = Object.assign({
      generateCsv: true,
      includeErrors: true
    }, options ?? {});
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
    mapping: CsvMapping,
    columnSpecs: ColumnSpec[]
  ): MappedOutput {
    // Validate required columns are mapped
    const {isValid, missingRequired, mappedTargets} = this.validateRequiredMapping(mapping, columnSpecs);
    if (!isValid) {
      throw new Error(`Required columns are not mapped: ${missingRequired.join(', ')}`);
    }

    // Handle empty mapping case
    if (Object.keys(mapping).length === 0 && !columnSpecs.some(c => c.required)) {
      return this.handleEmptyMapping(inputCsv, mapping, columnSpecs);
    }

    // Transform rows
    const {data, errors} = this.transformRows(inputCsv, mapping, columnSpecs);

    // Generate CSV if requested (simple format only)
    let csv: string | null = null;
    if (this.options.generateCsv) {
      csv = this.generateCsv(data);
    }

    // Calculate validation summary
    const validation = this.calculateValidationSummary(data, errors);

    return { data, csv, validation };
  }

  private calculateValidationSummary(csv: Csv, errors: ValidationError[]): ValidationResult {
    const errorsByField: Record<string, number> = {};
    const errorsByRow: Record<number, number> = {};
    errors.forEach(error => {
      const field = error.field || 'unknown';
      errorsByField[field] = (errorsByField[field] || 0) + 1;
      errorsByRow[error.rowIndex] = (errorsByRow[error.rowIndex] || 0) + 1;
    });

    return {
      errors: errors,
      totalRows: csv.length,
      errorRows: Object.keys(errorsByRow).length,
      totalErrors: errors.length,
      errorsByField
    };
  }

  private _invertMapping(mapping: CsvMapping): CsvMapping {
    const inverted: CsvMapping = {};
    for (let [source, targets] of Object.entries(mapping)) {
      if (typeof targets === 'string') {
        targets = [targets];
      }
      for (const target of targets) {
        if (Array.isArray(inverted[target])) {
          inverted[target].push(source);
        } else {
          inverted[target] = [source];
        }
      }
    }
    return inverted;
  }

  /**
   * Transform individual rows according to column specifications
   * @param inputCsv Source data rows
   * @param mapping Target column to source headers mapping
   * @param columnSpecs Column specifications
   * @returns Transformed rows with validation errors
   */
  private transformRows(
    inputCsv: Csv,
    mapping: CsvMapping,
    columnSpecs: ColumnSpec[]
  ): {data: Csv, errors: ValidationError[]} {
    let rowIndex = 0;
    const errors: ValidationError[] = [];
    const inverseMapping = this._invertMapping(mapping);
    let data = inputCsv.clone();
    data.remapColumns(mapping);
    const headers = columnSpecs.map(spec => spec.outputHeader ?? spec.name ?? spec.title);

    debug({mapping, inverseMapping});

    if (data.headers) {
      const toRemove = data.headers?.filter(header => !inverseMapping[header]);
      toRemove.forEach(col => data.removeColumn(col));
    }

    const missingColumns = columnSpecs.filter(spec => {
      const sourceHeaders = inverseMapping[spec.name] || [];
      return sourceHeaders.length === 0;
    }).map(a => a.outputHeader ?? a.name);

    missingColumns.forEach(colName => {
      const column = columnSpecs.find(spec => (spec.outputHeader ?? spec.name ?? spec.title) === colName);
      data.addColumn(colName, null, column?.defaultValue ?? null);
    });

    data.reorderColumns(headers);

    const colCache = new Map<string|number, ColumnSpec|null>();
    for (const sourceRow of data) {
      for (const [colIndex, value, header] of sourceRow.entries()) {
        const spec = colCache.get(header) ?? columnSpecs.find(spec => (spec.outputHeader ?? spec.name ?? spec.title) === header);
        colCache.set(header, spec ?? null);
        if (!spec) {
          logger.warn(`No column spec found for header "${header}".`, {header, spec});
          throw new Error(`Column spec not found for ${header}`);
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
        sourceRow.set(colIndex, transformedValue);
      }
      rowIndex++;
    }

    return {data, errors: []};
  }

  /**
   * Generate CSV output from transformed data
   * @param mappedRows Transformed data rows
   * @param columnSpecs Column specifications
   * @returns CSV string
   */
  private generateCsv(
    csv: Csv,
  ): string {
    return csv.toString({
      quoteChar: this.options.quoteChar,
      escapeChar: this.options.escapeChar,
      delimiter: this.options.delimiter,
      newline: this.options.newline,
    });
  }

  /**
   * Handle case where no columns are mapped but none are required
   * @param inputCsv Source data rows
   * @param columnSpecs Column specifications
   * @returns Transform result with empty mapped columns
   */
  private handleEmptyMapping(
    inputCsv: Csv,
    mapping: CsvMapping,
    columnSpecs: ColumnSpec[]
  ): MappedOutput {
    const rows = [];

    // Create empty rows for each input row
    for (let i = 0; i < inputCsv.length; i++) {
      const row = [];
      for (const spec of columnSpecs) {
        row.push('');
      }
      rows.push(row);
    }

    const headers = columnSpecs.map(spec => spec.outputHeader ?? spec.name ?? spec.title);
    const emptyCsv = new Csv(rows, headers);

    const {data, errors} = this.transformRows(emptyCsv, mapping, columnSpecs);

    let csv: string | null = null;
    if (this.options.generateCsv) {
      csv = this.generateCsv(emptyCsv);
    }

    const validation = this.calculateValidationSummary(data, errors);
    return { data, csv, validation };
  }

  /**
   * Validate that all required columns are mapped
   * @param mapping Source to target mapping
   * @param columnSpecs Column specifications
   * @returns Array of missing required column names
   */
  private validateRequiredMapping(mapping: CsvMapping, columnSpecs: ColumnSpec[]): { isValid: boolean; missingRequired: string[]; mappedTargets: string[] } {
    const missingRequired: string[] = [];

    // Get all mapped targets using the helper method
    const mappedTargets = this.getAllMappedTargets(mapping);
    const mappedTargetsSet = new Set(mappedTargets);

    for (const spec of columnSpecs) {
      if ((spec.required && (typeof spec.defaultValue === 'undefined')) && !mappedTargetsSet.has(spec.name)) {
        missingRequired.push(spec.name);
      }
    }

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      mappedTargets
    };
  }

  getAllMappedTargets(mapping: CsvMapping): string[] {
    const targets = new Set<string>();
    Object.values(mapping).forEach(value => {
      if (typeof value === 'string') {
        targets.add(value);
      } else {
        value.forEach(col => targets.add(col));
      }
    });
    return Array.from(targets);
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
