import {
  CsvDialect,
  ColumnSpec,
  ValidationResult,
  CsvMapperOptions,
  ParseOptions,
  ParseResult,
  DetectDialectOptions,
  MappedOutput,
  UIRenderer,
  UIRenderOptions,
  CsvParser,
  MappingResult,
  CsvMapping,
  RequiredColumnValidationResult,
  DataTransformer
} from './types.js';

import { DefaultDataTransformer } from './transform/defaultDataTransformer.js';
import { AutoMapper } from './transform/autoMapper.js';
import { DefaultUIRenderer } from './ui/renderer/default.js';
import { PapaParser } from './csv/papaParser.js';
import { limitString, debug, debugTable } from './helpers.js';
import { Csv } from './csv/csv.js';

export * from './types.js';

export interface CsvMapperOpts extends Omit<CsvMapperOptions, 'columns'> {}

/**
 * @emits beforeParseCsv - before parsing CSV text
 * @emits afterParseCsv - after parsing CSV text
 * @emits afterRead - after reading file text (before parsing)
 * @emits mappingChange - when the mapping changes (user or programmatically)
 * @emits mappingFailed - when mapping is invalid (e.g. required columns missing)
 * @emits mappingSuccess - when mapping is valid
 * @emits beforeMap - before validating the mapping
 * @emits afterMap - after validating the mapping
 * @emits beforeRemap - before remapping data
 * @emits afterRemap - after remapping data
 * @emits validationFailed - after remapping, if there were validation errors
 * @emits validationSuccess - after remapping, if there were no validation errors
 * @emits transformationFail - when a transformation error occurs during data transformation
 * @emits validationFail - when a validation error occurs during data transformation
 */
export default class CsvMapper extends EventTarget {
  /** The HTML input being used/monitored (if set) */
  public input: HTMLInputElement | null = null;
  /**
   * The currently set options. Caution: setting these
   * might not change the behaviour correctly, and should
   * not be set directly.
   */
  public opts: CsvMapperOpts;
  /**
   * The currently set columns
   */
  public columns: ColumnSpec[] = [];

  /**
   * The controls element (if any) where the UI is rendered.
   *
   * This will be the element passed in the controlsContainer
   * option if set, or dynamically created at runtime.
   */
  public controlsEl: HTMLElement | null = null;
  /**
   * The current CSV column mapping from CSV header to config column(s)
   */
  private mapping: CsvMapping = {};
  /**
   * The parsed CSV headers.
   */
  public get headers(): string[] {
    return this.csv?.headers ?? [];
  }
  /**
   * The parsed CSV dialect.
   */
  private dialect: CsvDialect = { separator: ',', enclosure: '"', escape: null };

  /**
   * Whether the current mapping and data is valid.
   */
  public isValid: boolean = true;

  /**
   * The input CSV as a Csv object.
   */
  public csv: Csv | null = null;

  /**
   * The renderer for the UI.
   */
  private uiRenderer!: UIRenderer;
  /**
   * The CSV parser.
   */
  private parser: CsvParser;
  /**
   * The data transformer and validator for the CSV data.
   */
  private transformer!: DataTransformer;

  /**
   * @param fileInputOrOptions selector or element for file input, or options if no file input required
   * @param options configuration options
   */
  constructor(fileInputOrOptions: HTMLInputElement | string | CsvMapperOptions, options: CsvMapperOptions = {}) {
    super();
    if (typeof fileInputOrOptions === 'string') {
      const fi = document.querySelector(fileInputOrOptions) as any;
      if (!(fi instanceof HTMLInputElement)) {
        throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
      }
      fileInputOrOptions = fi;
    }
    if (fileInputOrOptions instanceof HTMLInputElement) {
      this.input = fileInputOrOptions;
      if (this.input.type !== 'file') {
        throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
      }
    } else if (typeof fileInputOrOptions === 'object' && !(fileInputOrOptions instanceof HTMLElement) ) {
      options = fileInputOrOptions;
    } else {
      throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
    };

    this.opts = Object.assign({
      // Parsing/dialect
      headers: true,
      delimiter: '',
      quoteChar: '',
      escapeChar: '',
      // Library behavior
      remap: true,
      showUserControls: this.input ? true : false,
      mappingInput: null,
      controlsContainer: null,
      columns: [],
      autoThreshold: 0.8,
      setInputValidity: false,
      uiRenderer: null,
      mappingMode: 'configToCsv',
      allowMultipleSelection: false,
    }, options || {});

    this.setColumns(options.columns);

    this.parser = this.opts.parser || new PapaParser();
    this.setUiRenderer(this.opts.uiRenderer);
    this.setTransformer(this.opts.transformer ?? new DefaultDataTransformer(this.opts.output ?? {}));

    this.controlsEl = this._resolveNode(this.opts.controlsContainer || null) || this._autoinsertContainer();

    this._onFileChange = this._onFileChange.bind(this);
    if (this.input) {
      this.input.addEventListener('change', this._onFileChange);
    }
  }

  destroy(){
    if (this.input) {
      this.input.removeEventListener('change', this._onFileChange);
    }
    if (this.controlsEl && this.controlsEl.dataset.csvMapperAutocreated === '1') this.controlsEl.remove();
    this.uiRenderer.destroy();
  }

  // ===== Public API =====

  getHeaders() {
    return [...this.headers];
  }

  /**
   * Gets the detected dialect of the currently loaded CSV.
   */
  getDialect() {
    return Object.assign({}, this.dialect);
  }

  setColumns(columns: (ColumnSpec|string)[] = []): void {
    this.columns = columns.map(c => typeof c === 'string' ? { name:c } : Object.assign({}, c));
    this.columns.forEach(c => { if (!c.title) c.title = c.name; });
  }

  // Many-to-many mapping API methods
  getMapping(){
    return Object.assign({}, this.mapping);
  }

  /**
   * Sets the mapping for CSV headers to config columns.
   * @param map Mapping object in either simple (string) or advanced (array) format
   *
   * @example
   * mapper.setMapping({'CSV Header': 'config_column'});
   * mapper.setMapping({'CSV Header': ['config_column1', 'config_column2']});
   */
  setMapping(map: Record<string, string | string[]> | null): void {
    this.mapping = {};
    if (map) {
      Object.entries(map).forEach(([csvHeader, target]) => {
        if (typeof target === 'string') {
          // Legacy format: string values
          if (target) {
            this._addMapping(csvHeader, target);
          }
        } else {
          // New format: array values
          target.forEach(configColumn => {
            if (configColumn) {
              this._addMapping(csvHeader, configColumn);
            }
          });
        }
      });
    }
    this._onMappingChange();
  }

  resetColumnMapping(): void {
    this.mapping = {};
    this._onMappingChange();
  }

  addColumnMappings(mappings: Record<string, string>[]): void {
    mappings.forEach(({csvHeader, configColumn}) => {
      this._addMapping(csvHeader, configColumn);
    });
    this._onMappingChange();
  }

  addColumnMapping(csvHeader: string, configColumn: string): void {
    this._addMapping(csvHeader, configColumn);
    this._onMappingChange();
  }

  removeColumnMapping(csvHeader: string, configColumn: string): void {
    this._removeMapping(csvHeader, configColumn);
    this._onMappingChange();
  }

  clearColumnMapping(csvHeader: string): void {
    this._clearMapping(csvHeader);
    this._onMappingChange();
  }

  getColumnMappings(csvHeader: string): string[] {
    return this._getMappedColumns(csvHeader);
  }

  getAllMappings(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    // Include all CSV headers, even if they have no mappings
    this.headers.forEach(header => {
      result[header] = this._getMappedColumns(header);
    });
    return result;
  }

  getParser(): CsvParser {
    return this.parser;
  }

  setParser(parser: CsvParser) {
    this.parser = parser;
  }

  getUiRenderer(): UIRenderer {
    return this.uiRenderer;
  }

  setUiRenderer(uiRenderer: UIRenderer | string | null | undefined) {
    this.uiRenderer = this._resolveUiRenderer(uiRenderer);
  }

  getTransformer(): DataTransformer {
    return this.transformer;
  }

  setTransformer(dataTransformer: DataTransformer) {
    this.transformer = dataTransformer;

    this.transformer.addEventListener('transformationError', (evt) => {
      const transformationFailEvent = new CustomEvent('transformationFail', {detail: (evt as CustomEvent).detail, cancelable: true});
      if (!this.dispatchEvent(transformationFailEvent)) {
        evt.preventDefault();
      }
    });

    this.transformer.addEventListener('valueValidationError', (evt) => {
      const validationFailEvent = new CustomEvent('validationFail', evt);
      this.dispatchEvent(validationFailEvent);
    });
  }

  /**
   * Sets a CSV via a File object (usually from a file input)
   */
  async setFile(file: File) {
    this.isValid = true;
    this.csv = null;
    this.uiRenderer.reset();

    const detail = { text: await file.text() };
    const afterReadEvent = new CustomEvent('afterRead', { cancelable: true, detail });
    const shouldContinue = this.dispatchEvent(afterReadEvent);

    if (shouldContinue) {
      this.mapping = {};
      this.mapCsv(detail.text); // Use the potentially modified text from detail
    }
  }

  /**
   * Sets the CSV text to be used.
   *
   * This will parse the CSV set the csv property appropriately.
   *
   * @group Main Methods
   */
  setCsv(csvText: string) {
    const beforeParseCsvDetail = { csv: csvText };
    const shouldParse = this.dispatchEvent(new CustomEvent('beforeParseCsv', { cancelable: true, detail: beforeParseCsvDetail }));
    if (!shouldParse) return this;

    const parsed = this.parser.parseCSV(beforeParseCsvDetail.csv, {
      headers: this.opts.headers,
      delimiter: this.opts.delimiter,
      quoteChar: this.opts.quoteChar,
      escapeChar: this.opts.escapeChar,
    });

    const stopFurther = this.dispatchEvent(new CustomEvent('afterParseCsv', { cancelable: true, detail: { csv: parsed } }));
    if (!stopFurther) return this;

    this.csv = new Csv(parsed.rawRows, parsed.headers);
    this.dialect = parsed.dialect;
    return this;
  }

  autoMap() {
    AutoMapper.map(
      this.headers,
      this.columns,
      this.opts.mappingMode,
      this.opts.autoThreshold || 0.8,
      this.mapping
    );
  }

  render() {
    this._renderControls();
  }

  /**
   * Maps CSV text (or currently loaded CSV) using the current configuration
   * and returns the result.
   * @group Main Methods
   * @param csvText Optional CSV text to parse and map. If not provided, uses currently loaded CSV.
   * @returns MappedOutput object with data, csv string, and validation info, or false if error or no csv loaded.
   *
   * @example
   * // Map currently loaded CSV
   * const result = mapper.mapCsv();
   * if (result) document.getElementById('csv').value = result.csv;
   *
   * // Map new CSV text
   * const csvText = 'Name,Email\nAlice,Alice@example.com';
   * const result2 = mapper.mapCsv(csvText);
   * if (result2) document.getElementById('csv').value = result2.csv;
   */
  mapCsv(csvText?: string): MappedOutput|false {
    if (typeof csvText !== 'undefined') {
      this.setCsv(csvText);
    }

    if (!this.csv) {
      debug('No csv');
      return false;
    }

    // Initialize empty mapping - we'll populate it through auto-mapping or user interaction
    this._autoMap();
    if (this.opts.showUserControls) this._renderControls();
    return this.getMappedResult() ?? false;
  }

  remap(): boolean {
    this.isValid = true;
    this._renderControls();

    const beforeMapEvent = new CustomEvent('beforeMap', { cancelable: true, detail: { csv: this.csv } });
    const continueMapping = this.dispatchEvent(beforeMapEvent);

    if (!continueMapping) {
      return false;
    }

    const result = this._validateMapping();

    const amEvent = new CustomEvent('afterMap', { cancelable: true, detail: { csv: this.csv, isValid: result.isValid } });
    const isValid = result.isValid && this.dispatchEvent(amEvent);

    return isValid;
  }

  getMappedResult() : MappedOutput|void  {
    const result = this.remap();
    if (result) {
      // Trigger afterRemap event when mapping changes
      const brmEvent = new CustomEvent('beforeRemap', { cancelable: true, detail: { csv: this.csv } });
      const shouldRemap = this.dispatchEvent(brmEvent);
      if (!shouldRemap) return;

      const { data, csv, validation } = this._produceOutput();
      const armEvent = new CustomEvent('afterRemap', { detail: { rows: data.rows, csv } });
      this.dispatchEvent(armEvent);

      // Update mapping input
      const mappingInput = this._resolveNode(this.opts.mappingInput || null);
      if (mappingInput instanceof HTMLInputElement) {
        mappingInput.value = JSON.stringify(this.mapping);
      }
      this._renderControls(validation);

      if (this.input && this.opts.remap && csv) {
        this._replaceInputFileWithCsv(csv);
      }

      return { data, csv, validation };
    }
  }

  private _replaceInputFileWithCsv(csv: string) {
    const f = this.input!.files?.[0];
    const remappedBlob = new Blob([csv], { type: 'text/csv' });
    const newFile = new File([remappedBlob], f?.name ?? 'remapped.csv', { type: 'text/csv' });
    const replaced = this._tryReplaceFileList(newFile);
    if (!replaced) {
      console.warn('Could not replace file input contents - browser may not support it.');
    }
  }

  private _tryReplaceFileList(newFile: File): boolean {
    try {
      const dt = new DataTransfer();
      dt.items.add(newFile);
      // Some older browsers mark `files` as read-only in the IDL, but modern engines allow this.
      (this.input as any).files = dt.files;
      // sanity check
      return this.input!.files?.[0]?.name === newFile.name;
    } catch {
      return false;
    }
  }

  private _resolveUiRenderer(uiRenderer: UIRenderer | string | null | undefined): UIRenderer {
    if (typeof uiRenderer === 'string') {
      switch (uiRenderer) {
        default:
          uiRenderer = new DefaultUIRenderer();
      }
    } else {
      uiRenderer = uiRenderer || new DefaultUIRenderer();
    }
    uiRenderer.onMappingChange((sourceHeader, targetColumns) : CsvMapping => {
      if (this.opts.mappingMode === 'configToCsv') {
        const sources = Array.isArray(targetColumns) ? targetColumns : [targetColumns];
        const target = sourceHeader;
        for (let [header, mapped] of Object.entries(this.mapping)) {
          mapped = Array.isArray(mapped) ? mapped : [mapped];
          if (mapped.includes(target)) {
            this._removeMapping(header, target);
          }
        }
        for (const source of sources) {
          this._addMapping(source, target);
        }
      } else {
        if (Array.isArray(targetColumns)) {
          if (targetColumns.length === 1) {
            targetColumns = targetColumns[0];
          } else if (targetColumns.length === 0) {
            targetColumns = '';
          }
        }
        this.mapping[sourceHeader] = targetColumns;
      }
      debugTable(this.mapping);
      this._onMappingChange();
      this.getMappedResult();
      return this.mapping;
    });
    return uiRenderer;
  }

  private async _onFileChange() {
    this.isValid = true;
    this.csv = null;
    this.uiRenderer.reset();
    if (this.input) {
      const file = this.input.files && this.input.files[0];
      if (!file) return;
      this.setFile(file);
    }
  }

  private _autoMap(){
    this.autoMap();
    this._mappingChangeEvent();
  }

  private _validateMapping(): { isValid: boolean; missingRequired: string[]; mappedTargets: string[] } {
    const {isValid, mappedTargets, missingRequired} = this.validateRequiredColumns();
    this.isValid = isValid;

    if (isValid === false) {
      const mappingFailEvent = new CustomEvent('mappingFailed', {
        detail: {
          isValid: this.isValid,
          mappedTargets,
          mapping: this.mapping,
          missingRequired
        }
      });
      this.dispatchEvent(mappingFailEvent);
    } else {
      const mappingSuccessEvent = new CustomEvent('mappingSuccess', {
        detail: {
          isValid: this.isValid,
          mappedTargets,
          mapping: this.mapping
        }
      });
      this.dispatchEvent(mappingSuccessEvent);
    }

    // Set input validity if enabled
    if (this.opts.setInputValidity && this.input) {
      if (isValid) {
        this.input.setCustomValidity('');
      } else {
        const message = `Missing required columns: ${missingRequired.join(', ')}`;
        this.input.setCustomValidity(message);
      }
      this.input.reportValidity();
    }

    return {isValid, mappedTargets, missingRequired};
  }

  private _onMappingChange(): void {
    this.isValid = true;
    this._mappingChangeEvent();
    this.remap();
  }

  private _mappingChangeEvent() {
    const mappingChangeEvent = new CustomEvent('mappingChange', {
      detail: { mapping: this.mapping }
    });
    this.dispatchEvent(mappingChangeEvent);
  }

  /**
   * Checks if all required columns are mapped
   * @returns Object with validation status and missing required columns
   */
  validateRequiredColumns(): RequiredColumnValidationResult {
    const missingRequired: string[] = [];

    // Get all mapped targets using the helper method
    const mappedTargets = this._getAllMappedTargets();
    const mappedTargetsSet = new Set(mappedTargets);

    for (const spec of this.columns) {
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

  // Helper methods for managing flexible mapping structure
  private _addMapping(csvHeader: string, configColumn: string): void {
    const current = this.mapping[csvHeader];
    if (!current) {
      this.mapping[csvHeader] = configColumn;
    } else if (typeof current === 'string') {
      // Convert single value to array if adding another
      if (current !== configColumn) {
        this.mapping[csvHeader] = [current, configColumn];
      }
    } else {
      // Already an array, add if not present
      if (!current.includes(configColumn)) {
        current.push(configColumn);
      }
    }
  }

  private _removeMapping(csvHeader: string, configColumn: string): void {
    const current = this.mapping[csvHeader];
    if (!current) return;

    if (typeof current === 'string') {
      if (current === configColumn) {
        delete this.mapping[csvHeader];
      }
    } else {
      const index = current.indexOf(configColumn);
      if (index > -1) {
        current.splice(index, 1);
        if (current.length === 0) {
          delete this.mapping[csvHeader];
        } else if (current.length === 1) {
          // Convert back to single value
          this.mapping[csvHeader] = current[0];
        }
      }
    }
  }

  private _clearMapping(csvHeader: string): void {
    delete this.mapping[csvHeader];
  }

  private _getMappedColumns(csvHeader: string): string[] {
    const current = this.mapping[csvHeader];
    if (!current) return [];
    return typeof current === 'string' ? [current] : [...current];
  }

  private _getAllMappedTargets(): string[] {
    const targets = new Set<string>();
    Object.values(this.mapping).forEach(value => {
      if (typeof value === 'string') {
        targets.add(value);
      } else {
        value.forEach(col => targets.add(col));
      }
    });
    return Array.from(targets);
  }

  // Convert internal mapping to simple format for UI compatibility
  private _getSimpleMapping(): Record<string, string> {
    const simple: Record<string, string> = {};
    Object.entries(this.mapping).forEach(([csvHeader, value]) => {
      if (typeof value === 'string') {
        simple[csvHeader] = value;
      } else if (value.length > 0) {
        // For UI, just show the first mapping
        simple[csvHeader] = value[0];
      }
    });
    return simple;
  }

  // Get reverse mapping for configToCsv mode (configColumn -> csvHeader)
  private _getReverseMapping(): Record<string, string> {
    const reverse: Record<string, string> = {};
    Object.entries(this.mapping).forEach(([csvHeader, value]) => {
      if (typeof value === 'string') {
        reverse[value] = csvHeader;
      } else if (value.length > 0) {
        // For many-to-many: each config column should map to the same CSV header
        value.forEach(configColumn => {
          reverse[configColumn] = csvHeader;
        });
      }
    });
    return reverse;
  }

  private _produceOutput(): MappedOutput {
    // Check for missing required columns first
    const validationResult = this.validateRequiredColumns();
    if (!validationResult.isValid) {
      throw new Error(`Required columns are not mapped: ${validationResult.missingRequired.join(', ')}`);
    }
    const csvData = this.csv ?? new Csv();

    const transformationResult = this.transformer.transform(csvData, this.mapping, this.columns);

    const data = transformationResult.data;
    const validation = transformationResult.validation;
    const csv = transformationResult.csv;

    if (validation.totalErrors > 0) {
      const validationFailedEvent = new CustomEvent('validationFailed', {detail: {...transformationResult}});
      this.dispatchEvent(validationFailedEvent);
      this.isValid = false;
      if (this.input) {
        const errors = validation.errors;
        const pl = errors.length > 1;
        let errorMessage = `There ${pl ? 'were' : 'was'} ${errors.length} total validation/transformation error${pl ? 's' : ''} across ${validation.errorRows} ${validation.errorRows > 1 ? 'rows' : 'row'}:\n` + errors.slice(0, 5).map((e) => {
          return `Row ${e.rowIndex} [${e.field}] {${limitString(String(e.value), 20)}}`;
        }).join('\n');
        if (errors.length > 5)  {
          errorMessage += '\n...and ' + (errors.length - 5) + ' more errors';
        }
        if (this.opts.setInputValidity) {
          this.input.setCustomValidity(errorMessage);
          this.input.reportValidity();
        }
      }
    } else {
      const validationSuccessEvent = new CustomEvent('validationSuccess', {detail: {...transformationResult}});
      this.dispatchEvent(validationSuccessEvent);
      if (this.opts.setInputValidity && this.input) {
        this.input.setCustomValidity('');
        this.input.reportValidity();
      }
    }

    return { data, csv, validation };
  }

  // ===== UI =====
  private _renderControls(validation: ValidationResult = {errors: [], totalRows: 0, errorRows: 0, totalErrors: 0, errorsByField: {}}){
    if (!this.controlsEl || !this.opts.showUserControls) return;

    if (!this.headers.length) {
      this.uiRenderer.showMessage?.('No CSV loaded. Choose a file to begin.');
      return;
    }

    // Get current mapping status
    const mappingStatus = this._getMappingStatus();

    // Get appropriate mapping for UI based on mode
    const mappingMode = this.opts.mappingMode || 'csvToConfig';
    const currentMapping = mappingMode === 'configToCsv' ? this._getReverseMapping() : this._getSimpleMapping();

    // Prepare render options
    const renderOptions: UIRenderOptions = {
      headers: this.headers,
      columnSpecs: this.columns,
      currentMapping,
      fullMapping: this.mapping, // Pass the full many-to-many mapping
      mappingResult: mappingStatus,
      validation,
      rowCount: this.csv?.length || 0,
      dialect: this.dialect,
      mappingMode,
      allowMultipleSelection: this.opts.allowMultipleSelection
    };

    // Render using the UI renderer
    this.uiRenderer.render(this.controlsEl, renderOptions);
  }

  public redraw() {
    this._renderControls();
  }

  private _getMappingStatus(): MappingResult {
    const requiredColumns = this.columns.filter(c => c.required === true);
    const mappedTargets = this._getAllMappedTargets();
    const mappedTargetsSet = new Set(mappedTargets);
    const missingRequired = requiredColumns.filter(col => !mappedTargetsSet.has(col.name));

    return {
      isValid: missingRequired.length === 0,
      missingRequired: missingRequired.map(c => c.title || c.name),
      mappedColumns: mappedTargets
    };
  }

  // ===== Helpers =====
  private _resolveNode(ref: HTMLElement | string | null): HTMLElement | null {
    if (!ref) return null;
    if (typeof ref === 'string') return document.querySelector(ref);
    return ref;
  }
  private _autoinsertContainer(){
    if (!this.opts.showUserControls || !this.input) return null;
    const d=document.createElement('div');
    d.dataset.csvMapperAutocreated='1';
    this.input.insertAdjacentElement('afterend', d);
    return d;
  }

  static parseCSV(text: string, options: ParseOptions = {}): ParseResult {
    const parser = new PapaParser();
    return parser.parseCSV(text, options);
  }

  static detectDialect(text: string, options: DetectDialectOptions = {}): CsvDialect {
    const parser = new PapaParser();
    return parser.detectDialect(text, options);
  }

  // Attach UI renderers as static properties for easy access
  static DefaultUIRenderer = DefaultUIRenderer;
}