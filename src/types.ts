/*
 * Shared type definitions for CSV Mapper
 */

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

export interface ValidationResult {
  isValid: boolean;
  missingRequired: string[];
  mappedColumns: string[];
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

// UI Abstraction Types
export interface UIRenderOptions {
  headers: string[];
  columnSpecs: ColumnSpec[];
  currentMapping: Record<string, string>;
  validation: ValidationResult;
  rowCount: number;
  dialect: CsvDialect;
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
  onMappingChange(callback: (sourceHeader: string, targetColumn: string) => void): void;

  /**
   * Update the validation display
   */
  updateValidation(validation: ValidationResult): void;

  /**
   * Clean up resources when destroyed
   */
  destroy(): void;

  /**
   * Show a message/banner (optional)
   */
  showMessage?(message: string): void;
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
  setInputValidity?: boolean;
  uiRenderer?: UIRenderer | null;  // NEW: Custom UI renderer
  beforeParse?: ((text: string) => string | void) | null;
  beforeMap?: ((rows: Record<string, any>[]) => Record<string, any>[] | void) | null;
  afterMap?: ((rows: Record<string, any>[], csv: string | null) => void) | null;
}
