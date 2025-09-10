/*
 * Shared type definitions for CSV Mapper
 */

import { Csv } from "./csv/csv";
import { CsvRow } from "./csv/row";
import { TransformOptions } from "./transform/dataTransformer.clean";

export interface CsvDialect {
  separator: string;
  enclosure: string;
  escape: string | null;
}

export type CsvMapping = Record<string, string | string[]>; 

export interface ColumnSpec {
  name: string;
  title?: string;
  outputHeader?: string;
  defaultValue?: any;
  required?: boolean;
  allowDuplicates?: boolean;
  allowMultiple?: boolean;  // NEW: Allow this column to appear multiple times in output
  match?: RegExp | ((header: string) => boolean);
  transform?: (value: any, row: Record<string, any>) => any;
  validate?: RegExp | ((value: any) => boolean) | ValidationRule;
  validationMessage?: string;
  validationSuffix?: string;
}

export type ValidationType = 'number' | 'boolean' | 'email' | 'phone' | 'tel' | 'telephone' | 'date' | 'time' | 'datetime';

export interface ValidationRule {
  type: ValidationType;
  min?: number;
  max?: number;
  format?: string;
}

export interface MappingResult {
  isValid: boolean;
  missingRequired: string[];
  mappedColumns: string[];
}

export interface MappedOutput {
  data: Csv;
  csv: string | null;
  validation: ValidationResult;
}

export interface ValidationError {
  row: CsvRow,
  rowIndex: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  errors: ValidationError[],
  totalRows: number;
  errorRows: number;
  totalErrors: number;
  errorsByField: Record<string, number>;
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
  rawRows: string[][];
  dialect: CsvDialect;
}

export interface DetectDialectOptions {
  separator?: string | null | undefined;
  enclosure?: string | null | undefined;
  escape?: string | null | undefined;
  guessMaxLines?: number;
}

// CSV Parser Interface
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

// UI Abstraction Types
export interface UIRenderOptions {
  headers: string[];
  columnSpecs: ColumnSpec[];
  currentMapping: Record<string, string>; // Keep simple for UI compatibility
  fullMapping: Record<string, string | string[]>; // Full many-to-many mapping for advanced UI features
  mappingResult: MappingResult;
  validation: ValidationResult;
  rowCount: number;
  dialect: CsvDialect;
  mappingMode: MappingMode;
  allowMultipleSelection?: boolean; // Whether to allow many-to-many mapping
}

export interface UIRenderer {
  /**
   * Render the mapping interface
   */
  render(container: HTMLElement, options: UIRenderOptions): void;

  /**
   * Set up event listeners for mapping changes
   * @param onMappingChange Callback when user changes a mapping
   */
  onMappingChange(callback: (sourceHeader: string, targetColumn: string) => CsvMapping): void;

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



export interface CsvMapperOptions {
  separator?: string;
  enclosure?: string;
  escape?: string;
  guessMaxLines?: number;

  output?: Partial<TransformOptions>;

  headers?: boolean;
  remap?: boolean;
  showUserControls?: boolean;
  mappingInput?: HTMLElement | string | null;
  controlsContainer?: HTMLElement | string | null;
  columns?: (string | ColumnSpec)[];
  autoThreshold?: number;
  allowUnmappedTargets?: boolean;
  setInputValidity?: boolean;
  parser?: CsvParser | null;
  uiRenderer?: UIRenderer | string | null;
  mappingMode?: MappingMode;
  allowMultipleSelection?: boolean;
  allowMultiple?: boolean;
}
