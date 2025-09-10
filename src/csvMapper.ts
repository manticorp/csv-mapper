import {
  CsvDialect,
  ColumnSpec,
  ValidationResult,
  ValidationType,
  ValidationRule,
  CsvMapperOptions,
  ParseOptions,
  ParseResult,
  DetectDialectOptions,
  MappedOutput,
  ValidationError,
  UIRenderer,
  UIRenderOptions,
  CsvParser,
  MappingMode,
  MappingResult,
  CsvMapping
} from './types.js';

import { DataTransformer } from './transform/dataTransformer.js';
import { AutoMapper } from './transform/autoMapper.js';
import { DefaultUIRenderer } from './ui/renderer/default.js';
import { PapaParser } from './csv/papaParser.js';
import { limitString, normalize, debug, debugTable } from './helpers.js';
import { Csv } from './csv/csv.js';

export * from './types.js';

export default class CsvMapper extends EventTarget {
  public input: HTMLInputElement | null = null;
  public opts: CsvMapperOptions;
  public columns: ColumnSpec[] = [];
  public controlsEl: HTMLElement | null = null;
  public mapping: CsvMapping = {}; // Flexible: CSV header -> config column(s)
  public headers: string[] = [];
  public dialect: CsvDialect = { separator: ',', enclosure: '"', escape: null };
  public uiRenderer: UIRenderer = new DefaultUIRenderer();
  public parser: CsvParser = new PapaParser();
  public isValid: boolean = true;
  public csv: Csv | null = null;
  public transformer!: DataTransformer;

  /**
   * @param fileInput selector or element for <input type=file>
   * @param options configuration options
   */
  constructor(fileInput: HTMLInputElement | string | CsvMapperOptions, options: CsvMapperOptions = {}) {
    super();
    if (typeof fileInput === 'string') {
      const fi = document.querySelector(fileInput) as any;
      if (!(fi instanceof HTMLInputElement)) {
        throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
      }
      fileInput = fi;
    }
    if (fileInput instanceof HTMLInputElement) {
      this.input = fileInput;
      if (this.input.type !== 'file') {
        throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
      }
    } else if (typeof fileInput === 'object' && !(fileInput instanceof HTMLElement) ) {
      options = fileInput;
    } else {
      throw new Error('CsvMapper: first argument must be a file input, selector or options object.');
    };

    this.opts = Object.assign({
      // Parsing/dialect
      separator: '',     // auto when falsy/empty string
      enclosure: '',     // auto when falsy/empty string
      escape: '',        // auto when falsy/empty string; fallback to doubling
      guessMaxLines: 25, // How many lines to use for auto dialect parsing
      // Library behavior
      headers: true,
      remap: true,
      showUserControls: this.input ? true : false,
      mappingInput: null,           // HTMLElement | false
      controlsContainer: null,      // selector | element | null
      columns: [],                  // canonical column spec
      autoThreshold: 0.8,
      allowUnmappedTargets: true,
      setInputValidity: false,      // Whether to use setCustomValidity on the file input
      uiRenderer: null,             // Custom UI renderer
      mappingMode: 'configToCsv',   // Default mapping direction
      allowMultipleSelection: false, // Whether to allow many-to-many mapping
      allowMultiple: false,         // Whether to generate multiple columns in output
    }, options || {});

    this.parser = this.opts.parser || new PapaParser();
    this.setColumns(this.opts.columns);
    this.controlsEl = this._resolveNode(this.opts.controlsContainer || null) || this._autoinsertContainer();
    this.setUiRenderer(this.opts.uiRenderer);

    this.transformer = new DataTransformer(this.opts.output ?? {});

    this.transformer.addEventListener('transformationFail', (evt) => {
      const transformationFailEvent = new CustomEvent('transformationFail', evt);
      return this.dispatchEvent(transformationFailEvent);
    });

    this.transformer.addEventListener('validationFail', (evt) => {
      const validationFailEvent = new CustomEvent('validationFail', evt);
      return this.dispatchEvent(validationFailEvent);
    });

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
  getMapping(){ return Object.assign({}, this.mapping); }
  setMapping(map: Record<string, string | string[]> | null): void {
    this.mapping = {};
    if (map) {
      Object.entries(map).forEach(([csvHeader, target]) => {
        if (typeof target === 'string') {
          // Legacy format: string values
          if (target) {
            this.addMapping(csvHeader, target);
          }
        } else {
          // New format: array values
          target.forEach(configColumn => {
            if (configColumn) {
              this.addMapping(csvHeader, configColumn);
            }
          });
        }
      });
    }
    this._onMappingChange();
  }
  getHeaders(){ return [...this.headers]; }
  getRawRows(){
    if (!this.csv) return [];
    return Array.from(this.csv).map(row => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < this.headers.length; i++) {
        obj[this.headers[i]] = row.get(i) || '';
      }
      return obj;
    });
  }
  getDialect(){ return Object.assign({}, this.dialect); }
  redraw(){ this.getMappedResult(); }
  setColumns(columns: (ColumnSpec|string)[] = []): void {
    this.columns = columns.map(c => typeof c === 'string' ? { name:c } : Object.assign({}, c));
    this.columns.forEach(c => { if (!c.title) c.title = c.name; });
  }

  // Many-to-many mapping API methods
  resetColumnMapping(): void {
    this.mapping = {};
    this._onMappingChange();
  }

  addColumnMappings(mappings: Record<string, string>[]): void {
    mappings.forEach(({csvHeader, configColumn}) => {
      this.addMapping(csvHeader, configColumn);
    });
    this._onMappingChange();
  }

  addColumnMapping(csvHeader: string, configColumn: string): void {
    this.addMapping(csvHeader, configColumn);
    this._onMappingChange();
  }

  removeColumnMapping(csvHeader: string, configColumn: string): void {
    this.removeMapping(csvHeader, configColumn);
    this._onMappingChange();
  }

  clearColumnMapping(csvHeader: string): void {
    this.clearMapping(csvHeader);
    this._onMappingChange();
  }

  getColumnMappings(csvHeader: string): string[] {
    return this.getMappedColumns(csvHeader);
  }

  getAllMappings(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    // Include all CSV headers, even if they have no mappings
    this.headers.forEach(header => {
      result[header] = this.getMappedColumns(header);
    });
    return result;
  }

  setUiRenderer(uiRenderer: UIRenderer | string | null | undefined) {
    this.uiRenderer = this._resolveUiRenderer(uiRenderer);
  }

  setCsv(csvText: string) {
    this._beforeParseCsv(csvText);
    const parsed = this.parser.parseCSV(csvText, {
      headers: this.opts.headers,
      separator: this.opts.separator,
      enclosure: this.opts.enclosure,
      escape: this.opts.escape,
      guessMaxLines: this.opts.guessMaxLines,
    });
    this._afterParseCsv(parsed);

    this.csv = new Csv(parsed.rawRows, parsed.headers);
    this.headers = parsed.headers;
    this.dialect = parsed.dialect;
    return this;
  }

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

  getMappedResult() : MappedOutput|void  {
    this.isValid = true;

    this._renderControls();

    const beforeMapEvent = new CustomEvent('beforeMap', {detail: {csv: this.csv}});
    this.dispatchEvent(beforeMapEvent);

    // Validate mapping
    const result = this._validateMapping();
    if (result.isValid) {
      // Trigger afterMap event when mapping changes
      const { data, csv, validation } = this._produceOutput();
      const amEvent = new CustomEvent('afterMap', { detail: { rows: data.rows, csv } });
      this.dispatchEvent(amEvent);

      // Update mapping input
      const mappingInput = this._resolveNode(this.opts.mappingInput || null);
      if (mappingInput instanceof HTMLInputElement) {
        mappingInput.value = JSON.stringify(this.mapping);
      }
      this._renderControls(validation);
      return { data, csv, validation };
    }
  }

  _resolveUiRenderer(uiRenderer: UIRenderer | string | null | undefined): UIRenderer {
    if (typeof uiRenderer === 'string') {
      switch (uiRenderer) {
        default:
          uiRenderer = new DefaultUIRenderer();
      }
    } else {
      uiRenderer = uiRenderer || new DefaultUIRenderer();
    }
    uiRenderer.onMappingChange((sourceHeader, targetColumn) : CsvMapping => {
      debug(`Mapping changed for ${sourceHeader} to ${targetColumn}`);

      // Check if this is a removal request in the format "csvHeader|configColumn"
      if (!targetColumn && sourceHeader.includes('|')) {
        const [csvHeader, configColumn] = sourceHeader.split('|');
        this.removeMapping(csvHeader, configColumn);
      } else if (targetColumn) {
        // Only add multiple mappings if allowMultipleSelection is enabled
        if (this.opts.allowMultipleSelection) {
          this.addMapping(sourceHeader, targetColumn);
        } else {
          // For single selection mode, clear any existing mapping first
          this.clearMapping(sourceHeader);
          this.mapping[sourceHeader] = targetColumn;
        }
      } else {
        this.clearMapping(sourceHeader);
      }
      debugTable(this.mapping);
      this._onMappingChange();
      return this.mapping;
    });
    return uiRenderer;
  }

  async _onFileChange() {
    this.isValid = true;
    this.csv = null;
    this.uiRenderer.reset();
    if (this.input) {
      const file = this.input.files && this.input.files[0];
      if (!file) return;

      const afterReadEventOb = { detail: { text: await file.text() } };

      const bpEvent = new CustomEvent('afterRead', afterReadEventOb);
      this.dispatchEvent(bpEvent);

      this.mapping = {};
      this.mapCsv(afterReadEventOb.detail.text);
    }
  }

  private _beforeParseCsv(csv: string) {
    this.dispatchEvent(new CustomEvent('beforeParseCsv', { detail: { csv } }));
  }

  private _afterParseCsv(csv: ParseResult) {
    this.dispatchEvent(new CustomEvent('afterParseCsv', { detail: { csv } }));
  }

  private _autoMap(){
    AutoMapper.map(
      this.headers,
      this.columns,
      this.opts.mappingMode,
      this.opts.autoThreshold || 0.8,
      this.mapping
    );
    this._mappingChangeEvent();
  }

  _validateMapping(): { isValid: boolean; missingRequired: string[]; mappedTargets: string[] } {
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

  _onMappingChange(): void {
    this.isValid = true;
    this._mappingChangeEvent();
    this.getMappedResult();
  }

  _mappingChangeEvent() {
    const mappingChangeEvent = new CustomEvent('mappingChange', {
      detail: { mapping: this.mapping }
    });
    this.dispatchEvent(mappingChangeEvent);
  }

  /**
   * Checks if all required columns are mapped
   * @returns Object with validation status and missing required columns
   */
  validateRequiredColumns(): { isValid: boolean; missingRequired: string[]; mappedTargets: string[] } {
    const missingRequired: string[] = [];

    // Get all mapped targets using the helper method
    const mappedTargets = this.getAllMappedTargets();
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
  addMapping(csvHeader: string, configColumn: string): void {
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

  removeMapping(csvHeader: string, configColumn: string): void {
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

  clearMapping(csvHeader: string): void {
    delete this.mapping[csvHeader];
  }

  getMappedColumns(csvHeader: string): string[] {
    const current = this.mapping[csvHeader];
    if (!current) return [];
    return typeof current === 'string' ? [current] : [...current];
  }

  getAllMappedTargets(): string[] {
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
  getSimpleMapping(): Record<string, string> {
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
  getReverseMapping(): Record<string, string> {
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

  _produceOutput(): MappedOutput {
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
  _renderControls(validation: ValidationResult = {errors: [], totalRows: 0, errorRows: 0, totalErrors: 0, errorsByField: {}}){
    if (!this.controlsEl || !this.opts.showUserControls) return;

    if (!this.headers.length) {
      this.uiRenderer.showMessage?.('No CSV loaded. Choose a file to begin.');
      return;
    }

    // Get current mapping status
    const mappingStatus = this._getMappingStatus();

    // Get appropriate mapping for UI based on mode
    const mappingMode = this.opts.mappingMode || 'csvToConfig';
    const currentMapping = mappingMode === 'configToCsv' ? this.getReverseMapping() : this.getSimpleMapping();

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

  private _getMappingStatus(): MappingResult {
    const requiredColumns = this.columns.filter(c => c.required === true);
    const mappedTargets = this.getAllMappedTargets();
    const mappedTargetsSet = new Set(mappedTargets);
    const missingRequired = requiredColumns.filter(col => !mappedTargetsSet.has(col.name));

    return {
      isValid: missingRequired.length === 0,
      missingRequired: missingRequired.map(c => c.title || c.name),
      mappedColumns: mappedTargets
    };
  }

  _banner(text: string): string { return `<div class="csvm-note">${CsvMapper.escape(text)}</div>`; }

  // ===== Helpers =====
  _resolveNode(ref: HTMLElement | string | null): HTMLElement | null {
    if (!ref) return null;
    if (typeof ref === 'string') return document.querySelector(ref);
    return ref;
  }
  _autoinsertContainer(){
    if (!this.opts.showUserControls || !this.input) return null;
    const d=document.createElement('div');
    d.dataset.csvMapperAutocreated='1';
    this.input.insertAdjacentElement('afterend', d);
    return d;
  }

  // ---------- CSV core - delegates to PapaParser ----------
  static parseCSV(text: string, options: ParseOptions = {}): ParseResult {
    const parser = new PapaParser();
    return parser.parseCSV(text, options);
  }

  static detectDialect(text: string, options: DetectDialectOptions = {}): CsvDialect {
    const parser = new PapaParser();
    return parser.detectDialect(text, options);
  }

  static toCsvRow(arr: any[], sep: string = ',', quote: string = '"', esc: string | null = null): string {
    const parser = new PapaParser();
    return parser.toCsvRow(arr, sep, quote, esc);
  }

  static _validateValue(fieldValue: any, validator: RegExp | ((value: any) => boolean) | ValidationRule | ValidationType): boolean {
    if (typeof validator === 'string') {
      validator = { type: validator };
    }
    if (validator instanceof RegExp) return CsvMapper._validateRegex(fieldValue, validator);

    if (typeof validator === 'function') return !!validator(fieldValue);

    if (validator && typeof validator === 'object'){
      const validationType = validator.type;

      if (['date', 'time', 'datetime'].includes(validationType)) {
        // default datetime value
        let validationRegex = /^\d{2,4}([./-])\d{2}\1\d{2,4} \d{2}([.:])\d{2}\2\d{2}$/;
        switch (validationType) {
          case 'date':
            validationRegex = /^\d{2,4}([./-])\d{2}\1\d{2,4}$/;
            break;
          case 'time':
            validationRegex = /^\d{2}([.:])\d{2}\1\d{2}$/;
            break;
        }
        const format = validator.format ?? null;
        if (format !== null) {
          validationRegex = CsvMapper.dateFormatToRegex(format);
        }
        return CsvMapper._validateRegex(fieldValue, validationRegex);
      }

      if (['tel', 'telephone', 'phone'].includes(validationType)) {
        const phoneRegex = /^[\d\s()+-]+$/;
        return CsvMapper._validateRegex(fieldValue, phoneRegex);
      }

      if (validationType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return CsvMapper._validateRegex(fieldValue, emailRegex);
      }

      if (validationType === 'number') {
        const num = Number(String(fieldValue).replace(',','.'));
        if (Number.isNaN(num)) return false;
        if (validator.min != null && num < validator.min) return false;
        if (validator.max != null && num > validator.max) return false;
        return true;
      }

      if (validationType === 'boolean') {
        const s = String(fieldValue).trim().toLowerCase();
        return ['1','0','true','false','yes','no','y','n',''].includes(s);
      }
    }
    console.error('Invalid validation type given', validator);
    throw new Error('Invalid validation type given');
  }

  static dateFormatToRegex(format:string, {
    anchors = true,
    allowUppercaseMD = true,
  } = {}): RegExp {
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    switch (format.toLowerCase()) {
      case 'iso8601': // example: 2005-08-15T15:52:01+0000
        return /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

      case 'rfc822': // example: Mon, 15 Aug 05 15:52:01 +0000
        return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d{2}|\d{4})\s(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;

      case 'rfc850': // example: Monday, 15-Aug-05 15:52:01 UTC
        return /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s(0[1-9]|[12]\d|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;

      case 'rfc1036': // example: Mon, 15 Aug 05 15:52:01 +0000
        return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(?:0?[1-9]|[12]\d|3[01])\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|[PMCE][SD]T|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;

      case 'rfc1123': // example: Mon, 15 Aug 2005 15:52:01 +0000
        // 4-digit year; allows GMT/UT or numeric offset
        return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\s(?:GMT|UT|[+-](?:[01]\d|2[0-3])[0-5]\d)$/i;

      case 'rfc7231': // example: Sat, 30 Apr 2016 17:52:13 GMT
        // IMF-fixdate (HTTP-date) — must be GMT
        return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(0[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d:[0-5]\d\sGMT$/i;

      case 'rfc2822': // example: Mon, 15 Aug 2005 15:52:01 +0000
        // Optional weekday; 4-digit year; seconds optional; numeric offset or common (obs-zone) names
        return /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(0?[1-9]|[12]\d|3[01])\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\s(?:[+-](?:[01]\d|2[0-3])[0-5]\d|UT|GMT|[ECMP][SD]T|[A-IK-Z])$/i;

      case 'w3c': // example: 2005-08-15T15:52:01+00:00
        // W3C-DTF (subset of ISO 8601): strict 'T', optional fractional seconds, 'Z' or ±HH:MM
        return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
    }


    const map : Record<string,string> = {
      // Years
      'X': '[-+]\\d{4}\\d*', // at least 4-digit year with - for BCE and + for CE, e.g. +0012, -1234, +1066, +2025
      'Y': '-?\\d{4}\\d*',   // at least 4-digit year, e.g. 0012, -1234, 1066, 2025
      'y': '-?\\d+',

      // Months
      'F': '(?:(?i)January|February|March|April|May|June|July|August|September|October|November|December)',
      'M': '(?:(?i)Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',
      'm': '(?:0[1-9]|1[0-2])',        // 01-12
      'n': '(?:[1-9]|1[0-2])',         // 1-12 (no leading 0)

      // Days
      'l': '(?:(?i)Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)',
      'D': '(?:(?i)Mon|Tue|Wed|Thu|Fri|Sat|Sun)',
      'd': '(?:0[1-9]|[12]\\d|3[01])', // 01-31
      'j': '(?:[1-9]|[12]\\d|3[01])',  // 1-31 (no leading 0)
      'S': '(?:(?i)st|nd|rd|th)',      // 1st, 2nd, 3rd, 4th, etc.

      // Hours / minutes / seconds
      'a': '(am|pm)',
      'A': '(AM|PM)',
      'h': '(?:[0][0-9]|1[0-2])',      // 00-12
      'H': '(?:[01]\\d|2[0-3])',       // 00-23
      'g': '(?:\\d|1[0-2])',           // 0-12
      'G': '(?:\\d|1\\d|2[0-3])',      // 0-23
      'i': '[0-5]\\d',                 // 00-59
      's': '[0-5]\\d',                 // 00-59

      // Misc handy ones if you need them later:
      'U': '\\d+',                     // seconds since Unix epoch
    };

    if (allowUppercaseMD) {
      map['M'] = map['m'];
      map['D'] = map['d'];
    }

    let out = '';
    for (let i = 0; i < format.length; i++) {
      const ch = format[i];

      // Backslash escapes the next character (PHP-style)
      if (ch === '\\') {
        i++;
        if (i < format.length) out += esc(format[i]);
        continue;
      }

      out += map[ch] || esc(ch);
    }

    return new RegExp((anchors ? '^' : '') + out + (anchors ? '$' : ''));
  }

  static _validateRegex(value: any, regex: RegExp): boolean {
    return regex.test(String(value));
  }

  static escape(s: any): string {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] || c));
  }

  // Attach UI renderers as static properties for easy access
  static DefaultUIRenderer = DefaultUIRenderer;
}