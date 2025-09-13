/*
 * Data Transformer – CSV data transformation and validation engine
 * ----------------------------------------------------------------
 * Handles transformation of parsed CSV data according to column specifications,
 * including validation, custom transforms, and output generation in various formats.
 */

import { ColumnSpec, ValidationError, MappedOutput, ValidationResult,  ValidationRule, CsvMapping, TransformType, DataTransformer, TransformFunction, ValidationFunction } from '../types.js';
import Str from '../str.js';
import { Csv } from '../csv/csv.js';
import { DateFormatter } from './dateFormatter.js';
import { debug, invertMapping } from '../helpers.js';

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
  dateFormatter?: string|((value: string) => string);
  /**
   * Function for transforming type="date" columns.
   * Otherwise, transforms all truthy values to 1 and falsy values to 0.
   */
  booleanFormatter?: { true: string, false: string } | ((value: string) => string);
}

export class DefaultDataTransformer extends EventTarget implements DataTransformer {
  private options: TransformOptions;

  constructor(options: Partial<TransformOptions> = {}) {
    super();
    this.options = Object.assign({
      allowUnmappedTargets: false,
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

    const csv = this.generateCsv(data);

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
    const inverseMapping = invertMapping(mapping);
    let data = inputCsv.clone();
    data.remapColumns(mapping);
    const headers = columnSpecs.map(spec => spec.outputHeader ?? spec.name ?? spec.title);

    if (data.headers && !this.options.allowUnmappedTargets) {
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
          continue;
        }

        // Apply custom transformation if specified
        let transformedValue = value;
        if (spec.transform) {
          try {
            transformedValue = this._transformValue(transformedValue, spec.transform, rowIndex, header, spec);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const tResult = this._transformationError(rowIndex, header, transformedValue, msg);
            if (!tResult) {
              throw error;
            }
          }
        }

        // Validate the transformed value
        if (spec.validate !== undefined) {
          const validate = typeof spec.validate === 'string' ? {type: spec.validate} : spec.validate;
          const isValid = DefaultDataTransformer.validateValue(transformedValue, validate, rowIndex, header, spec);

          if (isValid !== true) {
            let message: string;
            if (typeof isValid === 'string') {
              message = isValid;
            } else if (typeof validate === 'object' && validate !== null && 'type' in validate && validate.type) {
              message = `Value "${transformedValue}" is not a valid ${validate.type}`;
            } else if (validate instanceof RegExp) {
              message = `Value "${transformedValue}" does not match pattern ${validate}`;
            } else if (typeof validate === 'function') {
              message = `Value "${transformedValue}" failed custom validation`;
            } else {
              message = `Value "${transformedValue}" is invalid`;
            }

            if (spec.validationMessage) {
              message = spec.validationMessage;
            }

            const result = this._valueValidationError(rowIndex, header, transformedValue, message);
            if (result) {
              errors.push({
                row: sourceRow,
                rowIndex: rowIndex,
                field: header,
                message,
                value: transformedValue
              });
            }
          }
        }
        sourceRow.set(colIndex, transformedValue);
      }
      rowIndex++;
    }

    return {data, errors};
  }

  private _guessBoolean(val: any): boolean {
    if (typeof val === 'string') {
      val = val.trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(val)) return true;
      if (['false', '0', 'no', 'n'].includes(val)) return false;
    }
    return Boolean(val);
  }

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
  private static _transformNumber(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    let str = String(value).trim();

    if (str === '') {
      return '';
    }

    // Handle special cases first
    if (str === 'NaN' || str === 'Infinity' || str === '-Infinity') {
      return str;
    }

    // Store original for fallback
    const original = str;

    // Handle accounting format (parentheses for negative)
    let isNegative = false;
    if (str.startsWith('(') && str.endsWith(')')) {
      isNegative = true;
      str = str.slice(1, -1).trim();
    }

    // Handle percentage
    let isPercentage = false;
    if (str.endsWith('%')) {
      isPercentage = true;
      str = str.slice(0, -1).trim();
    }

    // Remove currency symbols (common ones)
    str = str.replace(/^[$€£¥₹₽¢₩₪₨₦₡₵₴₸₺₼₾₿＄￠￡￥￦]/u, '');

    // Handle European decimal comma format (e.g., "1.234,56")
    // Check if there are dots AND a comma, and comma is closer to the end
    const dotIndex = str.lastIndexOf('.');
    const commaIndex = str.lastIndexOf(',');

    if (dotIndex !== -1 && commaIndex !== -1) {
      if (commaIndex > dotIndex) {
        // European format: dots are thousand separators, comma is decimal
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // American format: commas are thousand separators, dot is decimal
        str = str.replace(/,/g, '');
      }
    } else if (commaIndex !== -1 && dotIndex === -1) {
      // Only comma present - could be decimal or thousand separator
      // If there are exactly 3 digits after comma, treat as thousand separator
      // Otherwise treat as decimal separator
      const afterComma = str.substring(commaIndex + 1);
      if (afterComma.length === 3 && /^\d+$/.test(afterComma) && commaIndex > 0) {
        // Likely thousand separator
        str = str.replace(',', '');
      } else {
        // Likely decimal separator
        str = str.replace(',', '.');
      }
    } else if (dotIndex === -1 && commaIndex === -1) {
      // No separators, remove other common thousand separators
      str = str.replace(/[\s'_]/g, '');
    } else {
      // Only dot present, remove comma thousand separators
      str = str.replace(/,/g, '');
    }

    // Remove remaining thousand separators (spaces, apostrophes, underscores)
    // But be careful not to remove spaces in scientific notation
    if (!str.match(/e[\s]*[+-]?\d+/i)) {
      str = str.replace(/[\s'_]/g, '');
    }

    // Handle explicit positive sign
    if (str.startsWith('+')) {
      str = str.slice(1);
    }

    // Apply negative from accounting format
    if (isNegative && !str.startsWith('-')) {
      str = '-' + str;
    }

    // Try to parse the cleaned string
    let parsed = parseFloat(str);

    // If parsing failed, try the original value
    if (isNaN(parsed)) {
      parsed = parseFloat(original);
      if (isNaN(parsed)) {
        // Last resort: try Number constructor on original
        parsed = Number(original);
        if (isNaN(parsed)) {
          return ''; // Return empty string if all parsing attempts fail
        }
      }
    }

    // Handle percentage conversion
    if (isPercentage) {
      parsed = parsed / 100;
    }

    // Return as string, preserving precision
    return String(parsed);
  }

  private _transformBoolean(value: any): string {
    if (this.options.booleanFormatter) {
      if (typeof this.options.booleanFormatter === 'function') {
        value = this.options.booleanFormatter(value);
      } else if (typeof this.options.booleanFormatter === 'object') {
        value = this._guessBoolean(value);
        value = value ? this.options.booleanFormatter.true : this.options.booleanFormatter.false;
      } else {
        throw new Error('Invalid booleanFormatter option');
      }
    } else {
      value = this._guessBoolean(value) ? '1' : '0';
    }
    return value;
  }

  private _transformDate(value: any, row: number, column: string|number, spec: ColumnSpec) {
    let formatter: string|TransformFunction|undefined = this.options.dateFormatter;
    if (
      typeof spec.transform === 'object' &&
      spec.transform !== null &&
      'format' in spec.transform &&
      typeof spec.transform.format !== 'undefined'
    ) {
      formatter = spec.transform.format;
    }
    if (formatter) {
      if (typeof formatter === 'function') {
        value = formatter(value, row, column, spec);
      } else if (typeof formatter === 'string') {
        value = this._formatDateString(value, formatter);
      }
    } else {
      value = new Date(value);
      if (isNaN(value.getTime())) {
        return `Invalid Date`;
      }
      value = `${new Date(value)}`;
    }
    return value;
  }

  private _formatDateString(value: any, format: string): string {
    return DateFormatter.format(value, format);
  }

  private _transformValue(value: any, transform: ColumnSpec['transform'], rowIndex: number, column: string|number, spec: ColumnSpec): any {
    let transformType = transform;
    if (
      typeof transformType === 'object' &&
      !Array.isArray(transformType) &&
      typeof transformType.type !== 'undefined'
    ) {
      transformType = transformType.type;
    }
    if (typeof transformType === 'string') {
      transformType = transformType.split('|').map(t => t.trim()) as TransformType[];
    }
    if (Array.isArray(transformType)) {
      for (const t of transformType) {
        if (typeof t === 'string') {
          switch (t) {
            case 'number':
              value = DefaultDataTransformer._transformNumber(value);
              break;
            case 'boolean':
              value = this._transformBoolean(value);
              break;
            case 'date':
              value = this._transformDate(value, rowIndex, column, spec);
              break;
            case 'string':
              value = String(value);
              break;
            case 'uppercase':
              value = String(value).toUpperCase();
              break;
            case 'lowercase':
              value = String(value).toLowerCase();
              break;
            case 'trim':
              value = String(value).trim();
              break;
            case 'kebab':
              value = Str.kebabCase(String(value));
              break;
            case 'snake':
              value = Str.snakeCase(String(value));
              break;
            case 'screaming_snake':
              value = Str.screamingSnakeCase(String(value));
              break;
            case 'title':
              value = Str.titleCase(String(value));
              break;
            case 'pascal':
              value = Str.pascalCase(String(value));
              break;
            case 'camel':
              value = Str.camelCase(String(value));
              break;
            case 'ascii':
              value = Str.ascii(String(value));
              break;
          }
        } else if (typeof t === 'function') {
          value = t(value, rowIndex, column, spec);
        }
      }
    } else if (typeof transformType === 'function') {
      value = transformType(value, rowIndex, column, spec);
    }
    return value;
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

    const csv = this.generateCsv(emptyCsv);

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
  static validateValue(fieldValue: any, validator: RegExp | ValidationFunction | ValidationRule, row: number, header: string|number, spec: ColumnSpec): boolean|string {
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      return true; // Empty values are considered valid unless required
    }

    if (validator instanceof RegExp) {
      return DefaultDataTransformer._validateRegex(fieldValue, validator);
    }

    if (typeof validator === 'function') {
      try {
        return validator(fieldValue, row, header, spec)
      } catch (error) {
        return false;
      }
    }

    if (typeof validator === 'object' && validator !== null) {
      const rule = validator as ValidationRule;
      // Handle ValidationRule based on its type
      switch (rule.type) {
        case 'email':
          return DefaultDataTransformer._validateRegex(fieldValue, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
        case 'number':
          const transformed = DefaultDataTransformer._transformNumber(String(fieldValue));
          if (transformed === '' && fieldValue !== '') return `"${header}" was empty, not a number in row ${row}.`;
          const num = Number(transformed);
          if (isNaN(num) || !isFinite(num)) return `"${header}" was not a valid number in row ${row}.`;
          if (rule.min !== undefined && num < rule.min) return `"${header}" was less than the minimum of ${rule.min} in row ${row}.`;
          if (rule.max !== undefined && num > rule.max) return `"${header}" was greater than the maximum of ${rule.max} in row ${row}.`;
          return true;
        case 'boolean':
          return ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(String(fieldValue).toLowerCase());
        case 'date':
        case 'datetime':
          if (rule.format) {
            return DateFormatter.validateFormat(String(fieldValue), rule.format);
          }
          return !isNaN(Date.parse(fieldValue));
        case 'phone':
        case 'tel':
        case 'telephone':
          return DefaultDataTransformer._validateRegex(fieldValue, /^[\+]?[\d\s\-\(\)\.]{7,15}$/);
        case 'time':
          return DefaultDataTransformer._validateRegex(fieldValue, /^((([0-9]|1[0-2])(AM|PM))|(([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?( ?(AM|PM))?))$/);
        default:
          return true;
      }
    }

    return true;
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
   * @returns Boolean indicating whether result was nullified
   */
  private _transformationError(rowIndex: number, columnName: string, value: any, message: string): boolean {
    return this.dispatchEvent(new CustomEvent('transformationError', {
      cancelable: true,
      detail: { rowIndex, columnName, value, message }
    }));
  }

  /**
   * Handle value validation errors
   * @param rowIndex Row index where error occurred
   * @param columnName Column name where error occurred
   * @param value Value that failed validation
   * @param message Error message
   * @returns Boolean indicating whether result was nullified
   */
  private _valueValidationError(rowIndex: number, columnName: string, value: any, message: string): boolean {
    const event = new CustomEvent('valueValidationError', {
      detail: { rowIndex, columnName, value, message }
    });
    return this.dispatchEvent(event);
  }
}
