/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
class DefaultUIRenderer {
    constructor() {
        this.container = null;
        this.mappingChangeCallback = null;
        this.currentOptions = null;
        // Ensure CSS is loaded
        DefaultUIRenderer._ensureStyles();
    }
    render(container, options) {
        this.container = container;
        this.currentOptions = options;
        if (!options.headers.length) {
            container.innerHTML = this._banner('No CSV loaded. Choose a file to begin.');
            return;
        }
        const validationDisplay = this._renderValidationStatus(options.validation);
        const mappingTable = this._renderMappingTable(options);
        container.innerHTML = `
      ${validationDisplay}
      <div class="csvm-card">
        <div class="csvm-card-h">
          Map your columns 
          <span class="csvm-tag">${options.rowCount} rows • sep: ${this._escape(options.dialect.separator || ',')}</span>
        </div>
        <div class="csvm-card-b">
          <table class="csvm-table">
            <thead>
              <tr>
                <th>Your CSV header</th>
                <th>Map to</th>
              </tr>
            </thead>
            <tbody>
              ${mappingTable}
            </tbody>
          </table>
        </div>
      </div>
    `;
        this._attachEventListeners();
    }
    onMappingChange(callback) {
        this.mappingChangeCallback = callback;
    }
    updateValidation(validation) {
        if (!this.container || !this.currentOptions)
            return;
        // Update just the validation display
        const validationElement = this.container.querySelector('.csvm-validation-status');
        if (validationElement) {
            validationElement.outerHTML = this._renderValidationStatus(validation);
        }
    }
    destroy() {
        // Clean up event listeners if needed
        this.container = null;
        this.mappingChangeCallback = null;
        this.currentOptions = null;
    }
    showMessage(message) {
        if (!this.container)
            return;
        this.container.innerHTML = this._banner(message);
    }
    _renderValidationStatus(validation) {
        const { isValid, missingRequired } = validation;
        return isValid
            ? `<div class="csvm-validation-status csvm-validation-success">✓ All required columns are mapped</div>`
            : `<div class="csvm-validation-status csvm-validation-error">
          ⚠ Missing required columns: ${missingRequired.join(', ')}
        </div>`;
    }
    _renderMappingTable(options) {
        return options.headers.map(header => {
            const currentMapping = options.currentMapping[header] || '';
            const selectOptions = this._generateSelectOptions(options.columnSpecs, currentMapping, options.currentMapping);
            return `
        <tr>
          <td><strong>${this._escape(header)}</strong></td>
          <td>
            <select data-src="${this._escape(header)}">
              ${selectOptions}
            </select>
          </td>
        </tr>
      `;
        }).join('');
    }
    _generateSelectOptions(columnSpecs, currentTargetName, allMappings) {
        // Count how many times each target is used
        const usageCounts = new Map();
        Object.values(allMappings).forEach(target => {
            if (target)
                usageCounts.set(target, (usageCounts.get(target) || 0) + 1);
        });
        const ignoreOption = '<option value="">— Ignore —</option>';
        const columnOptions = columnSpecs.map(spec => {
            const count = usageCounts.get(spec.name) || 0;
            const isCurrentTarget = currentTargetName === spec.name;
            const canUse = spec.allowDuplicates === true || count === 0 || isCurrentTarget;
            const disabled = !canUse ? 'disabled' : '';
            const selected = isCurrentTarget ? 'selected' : '';
            const title = this._escape(spec.title || spec.name);
            const multiIndicator = spec.allowDuplicates ? ' (multi)' : '';
            return `<option value="${this._escape(spec.name)}" ${selected} ${disabled}>${title}${multiIndicator}</option>`;
        });
        return [ignoreOption, ...columnOptions].join('');
    }
    _attachEventListeners() {
        if (!this.container || !this.mappingChangeCallback)
            return;
        const selectElements = this.container.querySelectorAll('select[data-src]');
        selectElements.forEach(select => {
            select.addEventListener('change', () => {
                const sourceHeader = select.getAttribute('data-src');
                const targetColumn = select.value;
                if (sourceHeader && this.mappingChangeCallback) {
                    this.mappingChangeCallback(sourceHeader, targetColumn);
                }
            });
        });
    }
    _banner(text) {
        return `<div class="csvm-note">${this._escape(text)}</div>`;
    }
    _escape(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    static _ensureStyles() {
        const id = 'csv-mapper-styles';
        if (document.getElementById(id))
            return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      /* Light theme (default) */
      .csvm-card { 
        border: 1px solid #ddd; 
        border-radius: 4px; 
        margin: 10px 0; 
        background: #ffffff;
      }
      .csvm-card-h { 
        background: #f8f9fa; 
        padding: 12px 16px; 
        border-bottom: 1px solid #ddd; 
        font-weight: 600; 
        color: #333;
      }
      .csvm-card-b { padding: 0; }
      .csvm-table { 
        width: 100%; 
        border-collapse: collapse; 
        background: #ffffff;
      }
      .csvm-table th, .csvm-table td { 
        padding: 8px 12px; 
        text-align: left; 
        border-bottom: 1px solid #eee; 
        color: #333;
      }
      .csvm-table th { 
        background: #f8f9fa; 
        font-weight: 600; 
      }
      .csvm-table select { 
        width: 100%; 
        padding: 4px 8px; 
        border: 1px solid #ccc; 
        border-radius: 3px; 
        background: #ffffff;
        color: #333;
      }
      .csvm-tag { 
        background: #007cba; 
        color: white; 
        padding: 2px 6px; 
        border-radius: 3px; 
        font-size: 0.85em; 
        font-weight: normal; 
      }
      .csvm-note { 
        padding: 12px; 
        background: #f8f9fa; 
        border: 1px solid #ddd; 
        border-radius: 4px; 
        color: #6c757d; 
      }
      .csvm-validation-status { 
        padding: 8px 12px; 
        margin-bottom: 10px; 
        border-radius: 4px; 
        font-weight: 500; 
      }
      .csvm-validation-success { 
        background: #d4edda; 
        border: 1px solid #c3e6cb; 
        color: #155724; 
      }
      .csvm-validation-error { 
        background: #f8d7da; 
        border: 1px solid #f5c6cb; 
        color: #721c24; 
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .csvm-card { 
          border: 1px solid #444; 
          background: #1e1e1e;
        }
        .csvm-card-h { 
          background: #2d2d2d; 
          border-bottom: 1px solid #444; 
          color: #e0e0e0;
        }
        .csvm-table { 
          background: #1e1e1e;
        }
        .csvm-table th, .csvm-table td { 
          border-bottom: 1px solid #444; 
          color: #e0e0e0;
        }
        .csvm-table th { 
          background: #2d2d2d; 
        }
        .csvm-table select { 
          border: 1px solid #555; 
          background: #2d2d2d;
          color: #e0e0e0;
        }
        .csvm-table select:focus {
          border-color: #007cba;
          outline: none;
        }
        .csvm-tag { 
          background: #0099e6; 
        }
        .csvm-note { 
          background: #2d2d2d; 
          border: 1px solid #444; 
          color: #a0a0a0; 
        }
        .csvm-validation-success { 
          background: #1e3a1e; 
          border: 1px solid #2d5a2d; 
          color: #4caf50; 
        }
        .csvm-validation-error { 
          background: #3a1e1e; 
          border: 1px solid #5a2d2d; 
          color: #f44336; 
        }
      }
    `;
        document.head.appendChild(style);
    }
}

/**
 * Minimal UI renderer with a simpler, more compact interface
 * Good example of how to create alternative renderers
 */
class MinimalUIRenderer {
    constructor() {
        this.container = null;
        this.mappingChangeCallback = null;
        MinimalUIRenderer._ensureStyles();
    }
    render(container, options) {
        this.container = container;
        if (!options.headers.length) {
            container.innerHTML = '<div class="minimal-note">No CSV loaded</div>';
            return;
        }
        const { headers, columnSpecs, currentMapping, validation, rowCount, dialect } = options;
        // Simple compact layout
        container.innerHTML = `
      <div class="minimal-mapper">
        <div class="minimal-header">
          <span class="minimal-title">Map ${headers.length} columns</span>
          <span class="minimal-info">${rowCount} rows</span>
          ${this._renderValidationBadge(validation)}
        </div>
        
        <div class="minimal-mappings">
          ${headers.map(header => this._renderMappingRow(header, columnSpecs, currentMapping)).join('')}
        </div>
      </div>
    `;
        this._attachEventListeners();
    }
    onMappingChange(callback) {
        this.mappingChangeCallback = callback;
    }
    updateValidation(validation) {
        if (!this.container)
            return;
        const badge = this.container.querySelector('.minimal-validation-badge');
        if (badge) {
            badge.outerHTML = this._renderValidationBadge(validation);
        }
    }
    destroy() {
        this.container = null;
        this.mappingChangeCallback = null;
    }
    showMessage(message) {
        if (!this.container)
            return;
        this.container.innerHTML = `<div class="minimal-note">${this._escape(message)}</div>`;
    }
    _renderValidationBadge(validation) {
        const { isValid, missingRequired } = validation;
        const className = isValid ? 'minimal-validation-badge valid' : 'minimal-validation-badge invalid';
        const text = isValid ? '✓' : `⚠ ${missingRequired.length}`;
        const title = isValid ? 'All required columns mapped' : `Missing: ${missingRequired.join(', ')}`;
        return `<span class="${className}" title="${this._escape(title)}">${text}</span>`;
    }
    _renderMappingRow(header, columnSpecs, currentMapping) {
        const currentTarget = currentMapping[header] || '';
        const options = this._generateOptions(columnSpecs, currentTarget);
        return `
      <div class="minimal-mapping-row">
        <span class="minimal-source">${this._escape(header)}</span>
        <select class="minimal-select" data-src="${this._escape(header)}">
          ${options}
        </select>
      </div>
    `;
    }
    _generateOptions(columnSpecs, currentTarget) {
        const ignoreOption = '<option value="">—</option>';
        const columnOptions = columnSpecs.map(spec => {
            const selected = currentTarget === spec.name ? 'selected' : '';
            const title = spec.title || spec.name;
            return `<option value="${this._escape(spec.name)}" ${selected}>${this._escape(title)}</option>`;
        });
        return [ignoreOption, ...columnOptions].join('');
    }
    _attachEventListeners() {
        if (!this.container || !this.mappingChangeCallback)
            return;
        const selectElements = this.container.querySelectorAll('select[data-src]');
        selectElements.forEach(select => {
            select.addEventListener('change', () => {
                const sourceHeader = select.getAttribute('data-src');
                const targetColumn = select.value;
                if (sourceHeader && this.mappingChangeCallback) {
                    this.mappingChangeCallback(sourceHeader, targetColumn);
                }
            });
        });
    }
    _escape(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    static _ensureStyles() {
        const id = 'minimal-ui-styles';
        if (document.getElementById(id))
            return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      .minimal-mapper { border: 1px solid #ccc; border-radius: 6px; padding: 12px; font-family: -apple-system, sans-serif; }
      .minimal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
      .minimal-title { font-weight: 600; color: #333; }
      .minimal-info { font-size: 0.9em; color: #666; }
      .minimal-validation-badge { padding: 2px 6px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
      .minimal-validation-badge.valid { background: #d4edda; color: #155724; }
      .minimal-validation-badge.invalid { background: #f8d7da; color: #721c24; }
      .minimal-mappings { display: grid; gap: 6px; }
      .minimal-mapping-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: center; }
      .minimal-source { font-weight: 500; color: #333; font-size: 0.9em; }
      .minimal-select { padding: 4px 6px; border: 1px solid #ccc; border-radius: 3px; font-size: 0.9em; }
      .minimal-note { padding: 8px; color: #666; text-align: center; font-style: italic; }
    `;
        document.head.appendChild(style);
    }
}

/*
 * CSV Mapper – ES module source (no deps)
 * --------------------------------------
 * - Auto-detects separator, enclosure (quote), and escape char (supports doubled quotes or custom escape).
 * - Also accepts explicit config: separator, enclosure, escape. Pass empty string/undefined to auto-detect.
 * - Remapped CSV output preserves detected dialect unless overridden via outputSeparator/outputEnclosure/outputEscape.
 *
 * Example:
 *   import CsvMapper from './src/csv-mapper.js';
 *   const mapper = new CsvMapper('#csv', {
 *     separator: '',          // auto (default)
 *     enclosure: '',          // auto (default)
 *     escape: '',             // auto (default)
 *     outputSeparator: null,  // null => use detected input separator
 *     outputEnclosure: null,  // null => use detected input enclosure
 *     outputEscape: null,     // null => use detected input escape (or doubling)
 *     columns: ['id','name','sku','qty'],
 *   });
 */
class CsvMapper extends EventTarget {
    /**
     * @param fileInput selector or element for <input type=file>
     * @param options configuration options
     */
    constructor(fileInput, options = {}) {
        super();
        this.input = typeof fileInput === 'string' ? document.querySelector(fileInput) : fileInput;
        if (!(this.input instanceof HTMLInputElement) || this.input.type !== 'file') {
            throw new Error('CsvMapper: first argument must be a file input or selector.');
        }
        this.opts = Object.assign({
            // Parsing/dialect
            separator: '', // auto when falsy/empty string
            enclosure: '', // auto when falsy/empty string
            escape: '', // auto when falsy/empty string; fallback to doubling
            guessMaxLines: 25, // How many lines to use for auto dialect parsing
            // Output dialect for remap (null => inherit detected input; fallback comma+")
            outputSeparator: null,
            outputEnclosure: null,
            outputEscape: null,
            // Library behavior
            headers: true,
            remap: true,
            showUserControls: true,
            mappingInput: null, // HTMLElement | false
            controlsContainer: null, // selector | element | null
            columns: [], // canonical column spec
            autoThreshold: 0.8,
            allowUnmappedTargets: true,
            setInputValidity: false, // Whether to use setCustomValidity on the file input
            uiRenderer: null, // Custom UI renderer
            beforeParse: null,
            beforeMap: null,
            afterMap: null,
        }, options || {});
        this.columns = (this.opts.columns || []).map(c => typeof c === 'string' ? { name: c } : Object.assign({}, c));
        this.columns.forEach(c => { if (!c.title)
            c.title = c.name; });
        this.controlsEl = this._resolveNode(this.opts.controlsContainer || null) || this._autoinsertContainer();
        this.mapping = {}; // sourceHeader -> targetName
        this.headers = [];
        this.rows = [];
        this.dialect = { separator: ',', enclosure: '"', escape: null };
        // Initialize UI renderer
        this.uiRenderer = this.opts.uiRenderer || new DefaultUIRenderer();
        this.uiRenderer.onMappingChange((sourceHeader, targetColumn) => {
            this.mapping[sourceHeader] = targetColumn;
            this._onMappingChange();
        });
        this._onFileChange = this._onFileChange.bind(this);
        this.input.addEventListener('change', this._onFileChange);
        CsvMapper._ensureStyles();
    }
    destroy() {
        this.input.removeEventListener('change', this._onFileChange);
        if (this.controlsEl && this.controlsEl.dataset.csvMapperAutocreated === '1')
            this.controlsEl.remove();
        this.uiRenderer.destroy();
    }
    // ===== Public API =====
    getMapping() { return Object.assign({}, this.mapping); }
    setMapping(map) {
        this.mapping = Object.assign({}, map || {});
        if (this.opts.showUserControls)
            this._renderControls();
        this._validateMapping();
    }
    getHeaders() { return [...this.headers]; }
    getRawRows() { return this.rows.map(r => Object.assign({}, r)); }
    getDialect() { return Object.assign({}, this.dialect); }
    _validateMapping() {
        const requiredColumns = this.columns.filter(c => c.required === true);
        const mappedTargets = new Set(Object.values(this.mapping).filter(v => v));
        const missingRequired = requiredColumns.filter(col => !mappedTargets.has(col.name));
        const isValid = missingRequired.length === 0;
        // Fire validation event
        const validationEvent = new CustomEvent('validationChange', {
            detail: {
                isValid,
                missingRequired: missingRequired.map(c => c.title || c.name),
                mappedColumns: Array.from(mappedTargets)
            }
        });
        this.dispatchEvent(validationEvent);
        // Set input validity if enabled
        if (this.opts.setInputValidity) {
            if (isValid) {
                this.input.setCustomValidity('');
            }
            else {
                const message = `Missing required columns: ${missingRequired.map(c => c.title || c.name).join(', ')}`;
                this.input.setCustomValidity(message);
            }
            this.input.reportValidity();
        }
        return { isValid, missingRequired: missingRequired.map(c => c.title || c.name) };
    }
    _onMappingChange() {
        // Re-render UI controls to update validation status
        if (this.opts.showUserControls && this.controlsEl) {
            this._renderControls();
        }
        // Validate mapping
        this._validateMapping();
        // Trigger afterMap event when mapping changes
        try {
            const { mappedRows, csv } = this._produceOutput();
            const amEvent = new CustomEvent('afterMap', { detail: { rows: mappedRows, csv } });
            this.dispatchEvent(amEvent);
            if (typeof this.opts.afterMap === 'function') {
                this.opts.afterMap(mappedRows, csv);
            }
            // Update mapping input
            const mappingInput = this._resolveNode(this.opts.mappingInput || null);
            if (mappingInput instanceof HTMLInputElement) {
                mappingInput.value = JSON.stringify(this.mapping);
            }
        }
        catch (error) {
            // If validation fails, just dispatch the validation event above
            console.warn('Mapping change validation failed:', error);
        }
    }
    /**
     * Checks if all required columns are mapped
     * @returns Object with validation status and missing required columns
     */
    validateMapping() {
        const missingRequired = this._validateRequiredColumns();
        return {
            isValid: missingRequired.length === 0,
            missingRequired
        };
    }
    async _onFileChange() {
        const file = this.input.files && this.input.files[0];
        if (!file)
            return;
        let text = await file.text();
        const bpEvent = new CustomEvent('beforeParse', { detail: { text } });
        this.dispatchEvent(bpEvent);
        if (typeof this.opts.beforeParse === 'function') {
            text = this.opts.beforeParse(text) ?? text;
        }
        const parsed = CsvMapper.parseCSV(text, {
            headers: this.opts.headers,
            separator: this.opts.separator,
            enclosure: this.opts.enclosure,
            escape: this.opts.escape,
            guessMaxLines: this.opts.guessMaxLines,
        });
        this.headers = parsed.headers;
        this.rows = parsed.rows;
        this.dialect = parsed.dialect;
        this.mapping = Object.fromEntries(this.headers.map(h => [h, '']));
        this._autoMap();
        if (this.opts.showUserControls)
            this._renderControls();
        const bmEvent = new CustomEvent('beforeMap', { detail: { rows: this.getRawRows() } });
        this.dispatchEvent(bmEvent);
        if (typeof this.opts.beforeMap === 'function') {
            const maybe = this.opts.beforeMap(this.rows);
            if (Array.isArray(maybe))
                this.rows = maybe;
        }
        // Only try to produce output if all required columns are mapped, or if there are no required columns
        const validation = this.validateMapping();
        if (validation.isValid || !this.columns.some(c => c.required)) {
            try {
                const { mappedRows, csv } = this._produceOutput();
                const amEvent = new CustomEvent('afterMap', { detail: { rows: mappedRows, csv } });
                this.dispatchEvent(amEvent);
                if (typeof this.opts.afterMap === 'function') {
                    this.opts.afterMap(mappedRows, csv);
                }
            }
            catch (error) {
                // If validation fails during initial load, just skip the afterMap event
                console.warn('Initial mapping validation failed:', error);
            }
        }
        // Validate mapping after initial processing (this fires the validationChange event)
        this._validateMapping();
        const mappingInput = this._resolveNode(this.opts.mappingInput || null);
        if (mappingInput instanceof HTMLInputElement) {
            mappingInput.value = JSON.stringify(this.mapping);
        }
    }
    /**
     * Validates that all required columns are mapped
     * @returns Array of missing required column names
     */
    _validateRequiredColumns() {
        const missingRequired = [];
        const mappedTargets = new Set(Object.values(this.mapping).filter(Boolean));
        for (const spec of this.columns) {
            if (spec.required && !mappedTargets.has(spec.name)) {
                missingRequired.push(spec.name);
            }
        }
        return missingRequired;
    }
    _produceOutput() {
        // Check for missing required columns first
        const missingRequired = this._validateRequiredColumns();
        if (missingRequired.length > 0) {
            throw new Error(`Required columns are not mapped: ${missingRequired.join(', ')}`);
        }
        const targetToSource = {};
        for (const [src, tgt] of Object.entries(this.mapping)) {
            if (!tgt)
                continue;
            const spec = this.columns.find(c => c.name === tgt);
            if (!spec)
                continue;
            if (targetToSource[tgt] && spec.allowDuplicates !== true)
                continue;
            (targetToSource[tgt] || (targetToSource[tgt] = [])).push(src);
        }
        // If no columns are mapped and there are no required columns, return empty rows
        const hasMappings = Object.values(this.mapping).some(Boolean);
        if (!hasMappings && !this.columns.some(c => c.required)) {
            const emptyRows = this.rows.map(() => {
                const out = {};
                for (const spec of this.columns) {
                    out[spec.name] = '';
                }
                return out;
            });
            let csv = null;
            if (this.opts.remap) {
                const outSep = this.opts.outputSeparator ?? this.dialect.separator ?? ',';
                const outQuote = this.opts.outputEnclosure ?? this.dialect.enclosure ?? '"';
                const outEsc = this.opts.outputEscape ?? this.dialect.escape ?? null;
                const headerRow = this.columns.map(c => c.title || c.name);
                const lines = [CsvMapper.toCsvRow(headerRow, outSep, outQuote, outEsc)];
                for (const r of emptyRows) {
                    const arr = this.columns.map(c => '');
                    lines.push(CsvMapper.toCsvRow(arr, outSep, outQuote, outEsc));
                }
                csv = lines.join('\n');
            }
            return { mappedRows: emptyRows, csv };
        }
        const mappedRows = this.rows.map((row) => {
            const out = {};
            for (const spec of this.columns) {
                const srcHeaders = targetToSource[spec.name] || [];
                let raw = '';
                for (const h of srcHeaders) {
                    const v = row[h];
                    if (v != null && String(v) !== '') {
                        raw = v;
                        break;
                    }
                }
                let val = raw;
                if (spec.transform) {
                    try {
                        val = spec.transform(val, row);
                    }
                    catch (e) {
                        console.warn('CsvMapper transform error for', spec.name, e);
                    }
                }
                if (spec.validate) {
                    const ok = CsvMapper._validate(val, spec.validate);
                    if (!ok) {
                        const msg = spec.validationMessage || `Validation failed for ${spec.title || spec.name}`;
                        (out.__errors__ || (out.__errors__ = [])).push({ field: spec.name, message: msg, value: val });
                    }
                }
                out[spec.name] = val ?? '';
            }
            return out;
        });
        let csv = null;
        if (this.opts.remap) {
            const outSep = this.opts.outputSeparator ?? this.dialect.separator ?? ',';
            const outQuote = this.opts.outputEnclosure ?? this.dialect.enclosure ?? '"';
            const outEsc = this.opts.outputEscape ?? this.dialect.escape ?? null;
            const headerRow = this.columns.map(c => c.title || c.name);
            const lines = [CsvMapper.toCsvRow(headerRow, outSep, outQuote, outEsc)];
            for (const r of mappedRows) {
                const arr = this.columns.map(c => r[c.name]);
                lines.push(CsvMapper.toCsvRow(arr, outSep, outQuote, outEsc));
            }
            csv = lines.join('\n');
        }
        return { mappedRows, csv };
    }
    // ===== UI =====
    _renderControls() {
        if (!this.controlsEl || !this.opts.showUserControls)
            return;
        if (!this.headers.length) {
            this.uiRenderer.showMessage?.('No CSV loaded. Choose a file to begin.');
            return;
        }
        // Get current validation status
        const validation = this._getValidationStatus();
        // Prepare render options
        const renderOptions = {
            headers: this.headers,
            columnSpecs: this.columns,
            currentMapping: this.mapping,
            validation,
            rowCount: this.rows.length,
            dialect: this.dialect
        };
        // Render using the UI renderer
        this.uiRenderer.render(this.controlsEl, renderOptions);
    }
    _getValidationStatus() {
        const requiredColumns = this.columns.filter(c => c.required === true);
        const mappedTargets = new Set(Object.values(this.mapping).filter(v => v));
        const missingRequired = requiredColumns.filter(col => !mappedTargets.has(col.name));
        return {
            isValid: missingRequired.length === 0,
            missingRequired: missingRequired.map(c => c.title || c.name),
            mappedColumns: Array.from(mappedTargets)
        };
    }
    _banner(text) { return `<div class="csvm-note">${CsvMapper.escape(text)}</div>`; }
    // ===== Auto mapping =====
    _autoMap() {
        const used = new Map();
        for (const src of this.headers) {
            let best = '';
            let score = 0;
            for (const spec of this.columns) {
                const count = used.get(spec.name) || 0;
                const canUse = spec.allowDuplicates === true || count === 0;
                if (!canUse)
                    continue;
                const s = this._matchScore(src, spec);
                if (s > score) {
                    score = s;
                    best = spec.name;
                }
            }
            if (score >= this.opts.autoThreshold) {
                this.mapping[src] = best;
                used.set(best, (used.get(best) || 0) + 1);
            }
        }
    }
    _matchScore(srcHeader, spec) {
        const norm = CsvMapper.normalize(srcHeader);
        const title = CsvMapper.normalize(spec.title || '');
        const name = CsvMapper.normalize(spec.name || '');
        let score = 0;
        if (spec.match instanceof RegExp) {
            if (spec.match.test(srcHeader) || spec.match.test(norm))
                score = Math.max(score, 1.0);
        }
        else if (typeof spec.match === 'function') {
            try {
                if (spec.match(srcHeader) || spec.match(norm))
                    score = Math.max(score, 1.0);
            }
            catch (e) { }
        }
        if (norm === name || norm === title)
            score = Math.max(score, 0.98);
        if (norm.includes(name) || norm.includes(title))
            score = Math.max(score, 0.9);
        score = Math.max(score, CsvMapper.similarity(norm, name) * 0.85);
        score = Math.max(score, CsvMapper.similarity(norm, title) * 0.85);
        return score;
    }
    // ===== Helpers =====
    _resolveNode(ref) {
        if (!ref)
            return null;
        if (typeof ref === 'string')
            return document.querySelector(ref);
        return ref;
    }
    _autoinsertContainer() { if (!this.opts.showUserControls)
        return null; const d = document.createElement('div'); d.dataset.csvMapperAutocreated = '1'; this.input.insertAdjacentElement('afterend', d); return d; }
    // ---------- CSV core ----------
    static parseCSV(text, { headers = true, separator = '', enclosure = '', escape = '', guessMaxLines = 25 } = {}) {
        const needSep = !separator;
        const needQuote = !enclosure;
        const needEsc = escape === '' || escape == null;
        const dialect = CsvMapper.detectDialect(text, {
            separator: needSep ? undefined : separator,
            enclosure: needQuote ? undefined : enclosure,
            escape: needEsc ? undefined : escape,
            guessMaxLines
        });
        const sep = dialect.separator || ',';
        const quote = dialect.enclosure || '"';
        const esc = dialect.escape || null;
        const rows = CsvMapper._parseWithDialect(text, sep, quote, esc);
        if (headers) {
            const head = rows.shift() || [];
            const objs = rows.map(arr => Object.fromEntries(head.map((h, idx) => [h, arr[idx] ?? ''])));
            return { headers: head, rows: objs, dialect };
        }
        const maxLen = rows.reduce((m, a) => Math.max(m, a.length), 0);
        const head = Array.from({ length: maxLen }, (_, i) => `Column ${i + 1}`);
        const objs = rows.map(arr => Object.fromEntries(head.map((h, idx) => [h, arr[idx] ?? ''])));
        return { headers: head, rows: objs, dialect };
    }
    static _parseWithDialect(text, sep, quote, esc) {
        const rows = [];
        let i = 0, f = '', r = [], inQuotes = false;
        while (i < text.length) {
            const c = text[i];
            if (inQuotes) {
                if (esc && c === esc) {
                    const nxt = text[i + 1];
                    if (nxt === quote) {
                        f += quote;
                        i += 2;
                        continue;
                    }
                    f += c;
                    i++;
                    continue;
                }
                if (c === quote) {
                    inQuotes = false;
                    i++;
                    continue;
                }
                f += c;
                i++;
                continue;
            }
            if (c === quote) {
                inQuotes = true;
                i++;
                continue;
            }
            if (c === sep) {
                r.push(f);
                f = '';
                i++;
                continue;
            }
            if (c === '\n') {
                r.push(f);
                rows.push(r);
                r = [];
                f = '';
                i++;
                continue;
            }
            if (c === '\r') {
                if (text[i + 1] === '\n') {
                    i++;
                }
                r.push(f);
                rows.push(r);
                r = [];
                f = '';
                i++;
                continue;
            }
            if (!esc && c === quote && text[i + 1] === quote) {
                f += quote;
                i += 2;
                continue;
            }
            f += c;
            i++;
        }
        r.push(f);
        rows.push(r);
        if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '')
            rows.pop();
        return rows;
    }
    static detectDialect(text, { separator = null, enclosure = null, escape = null, guessMaxLines = 25 } = {}) {
        const seps = separator ? [separator] : [',', ';', '\t', '|', ':'];
        const quotes = enclosure ? [enclosure] : ['"', "'"];
        const escapes = escape != null ? [escape] : [null, '\\'];
        const lines = text.split(/\r\n|\n|\r/).filter((l) => l.length > 0).slice(0, guessMaxLines);
        if (lines.length === 0)
            return { separator: ',', enclosure: '"', escape: null };
        let best = { score: -Infinity, sep: ',', quote: '"', esc: null };
        for (const s of seps) {
            const sep = s === '\t' ? '\t' : s;
            for (const q of quotes) {
                for (const e of escapes) {
                    try {
                        const sampleRows = CsvMapper._parseWithDialect(lines.join('\n'), sep, q, e);
                        const counts = sampleRows.map(r => r.length);
                        const mode = CsvMapper._mode(counts) || 0;
                        const consistent = counts.filter(c => c === mode).length;
                        const penalty = mode <= 1 ? 50 : 0;
                        const sepHits = (lines[0].match(new RegExp(CsvMapper._escRe(sep), 'g')) || []).length;
                        const score = consistent * 100 + mode * 5 + sepHits - penalty;
                        if (score > best.score)
                            best = { score, sep, quote: q, esc: e };
                    }
                    catch (err) { /* ignore */ }
                }
            }
        }
        return { separator: best.sep, enclosure: best.quote, escape: best.esc };
    }
    static _mode(arr) {
        const m = new Map();
        let best = null, bestC = -1;
        for (const v of arr) {
            const c = (m.get(v) || 0) + 1;
            m.set(v, c);
            if (c > bestC) {
                best = v;
                bestC = c;
            }
        }
        return best;
    }
    static _escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, (r) => `\\${r}`); }
    static toCsvRow(arr, sep = ',', quote = '"', esc = null) {
        return arr.map((v) => {
            let s = String(v ?? '');
            const needsQuote = s.includes(sep) || s.includes('\n') || s.includes('\r') || s.includes(quote);
            if (esc)
                s = s.split(quote).join(esc + quote);
            else
                s = s.split(quote).join(quote + quote);
            return needsQuote ? quote + s + quote : s;
        }).join(sep);
    }
    static normalize(s) { return String(s || '').toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim(); }
    static similarity(a, b) {
        a = CsvMapper.normalize(a);
        b = CsvMapper.normalize(b);
        if (!a || !b)
            return 0;
        if (a === b)
            return 1;
        const grams = (str) => { const m = new Map(); for (let i = 0; i < str.length - 1; i++) {
            const g = str.slice(i, i + 2);
            m.set(g, (m.get(g) || 0) + 1);
        } return m; };
        const A = grams(a), B = grams(b);
        let inter = 0, total = 0;
        for (const [g, c] of A) {
            if (B.has(g))
                inter += Math.min(c, B.get(g));
            total += c;
        }
        for (const [, c] of B)
            total += c;
        return (2 * inter) / (total || 1);
    }
    static _validate(v, validator) {
        if (validator instanceof RegExp)
            return validator.test(String(v));
        if (typeof validator === 'function')
            return !!validator(v);
        if (validator && typeof validator === 'object') {
            const t = validator.type;
            if (t === 'number') {
                const num = Number(String(v).replace(',', '.'));
                if (Number.isNaN(num))
                    return false;
                if (validator.min != null && num < validator.min)
                    return false;
                if (validator.max != null && num > validator.max)
                    return false;
                return true;
            }
            if (t === 'boolean') {
                const s = String(v).trim().toLowerCase();
                return ['1', '0', 'true', 'false', 'yes', 'no', 'y', 'n', ''].includes(s);
            }
        }
        return true;
    }
    static _ensureStyles() {
        if (document.getElementById('csvm-style'))
            return;
        const css = `
      .csvm-card{background:#0d1533; color:#e7ecff; border:1px solid rgba(255,255,255,.12); border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.25)}
      .csvm-card-h{padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.12); font-weight:600; display:flex; align-items:center; gap:10px}
      .csvm-tag{font:12px/1.2 system-ui; background:rgba(124,156,255,.18); border:1px solid rgba(124,156,255,.35); padding:2px 8px; border-radius:999px}
      .csvm-card-b{padding:10px 12px}
      .csvm-table{border-collapse:collapse; width:100%; font: 13px/1.4 system-ui}
      .csvm-table th,.csvm-table td{border-bottom:1px solid rgba(255,255,255,.12); padding:8px 10px; text-align:left}
      .csvm-table th{color:#a8b4dc}
      .csvm-note{margin-top:8px; color:#a8b4dc}
      .csvm-card select{background:#0b1026; color:#e7ecff; border:1px solid rgba(255,255,255,.18); border-radius:8px; padding:6px 8px}
      .csvm-validation-error{margin-top:12px; padding:8px 12px; background:rgba(255,99,99,.1); border:1px solid rgba(255,99,99,.3); border-radius:8px; color:#ff9999; font:13px/1.4 system-ui}
      .csvm-validation-success{margin-top:12px; padding:8px 12px; background:rgba(99,255,99,.1); border:1px solid rgba(99,255,99,.3); border-radius:8px; color:#99ff99; font:13px/1.4 system-ui}
    `;
        const style = document.createElement('style');
        style.id = 'csvm-style';
        style.textContent = css;
        document.head.appendChild(style);
    }
    static escape(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] || c));
    }
}

export { DefaultUIRenderer, MinimalUIRenderer, CsvMapper as default };
//# sourceMappingURL=csv-mapper.esm.js.map
