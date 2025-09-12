import { debug, logger, classSafeString, invertMapping } from '../../helpers.js';
import { UIRenderer, UIRenderOptions, MappingResult, ColumnSpec, ValidationResult, CsvMapping } from '../../types.js';

export type MappingChangeCallback = (sourceHeader: string, targetColumn: string|string[]) => CsvMapping;

/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
export class DefaultUIRenderer implements UIRenderer {
  private container: HTMLElement | null = null;
  private mappingChangeCallback: MappingChangeCallback | null = null;
  private currentOptions: UIRenderOptions | null = null;
  private uniqid : string;
  private hasInitialRender: boolean = false;
  private lastDrawnMap : Record<string, string[]|string> = {};
  private redrawHash: Record<string,any> = {};

  constructor() {
    // Ensure CSS is loaded
    DefaultUIRenderer._ensureStyles();
    this.uniqid = Math.random().toString(36).substring(2, 10);
  }

  reset() {
    this.lastDrawnMap = {};
    this.redrawHash = {};
    return this;
  }

  protected conditionallySetContents(container: HTMLElement | null, content: string): void {
    if (container) {
      container.innerHTML = content;
    }
  }

  protected hashesAreEquivalent(a: Record<string, any>, b: Record<string, any>) : boolean
  {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  protected mappingModeHeaders(mode: string)
  {
    return [
      mode === 'configToCsv' ? 'Your configured columns' : 'Your CSV headers',
      mode === 'configToCsv' ? 'Map to CSV header' : 'Map to configured column',
    ];
  }

  protected mappingModeText(mode: string)
  {
    return mode === 'configToCsv' ? '(Config → CSV)' : '(CSV → Config)';
  }

  protected tagText(options: UIRenderOptions)
  {
    return `${options.rowCount} rows • sep: ${this._escape(options.dialect.separator || ',')}`;
  }

  reRender(container: HTMLElement, options: UIRenderOptions): void {
    logger.groupCollapsed('Re-Rendering');
    this.container = container;
    this.currentOptions = options;
    container.dataset.mappingMode = options.mappingMode;
    const redrawHash = {
      mappingMode: options.mappingMode,
      allowMultipleSelection: options.allowMultipleSelection,
      headers: options.headers.slice()
    };

    logger.debug(redrawHash, this.redrawHash, this.hashesAreEquivalent(this.redrawHash, redrawHash));

    const validationDisplay = this._renderValidationMessages(options.validation);
    const mappingModeText = this.mappingModeText(options.mappingMode);
    const [leftHeader, rightHeader] = this.mappingModeHeaders(options.mappingMode);
    const tagText = this.tagText(options);

    if (container) {
      this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-validation-display"]`), validationDisplay);
      this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-mode"]`), mappingModeText);
      this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-tag"]`), tagText);
      this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-header-left"]`), leftHeader);
      this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-header-right"]`), rightHeader);
      if (
        !this.hashesAreEquivalent(this.redrawHash, redrawHash) ||
        !this.hashesAreEquivalent(this.lastDrawnMap, options.fullMapping)
      ) {
        this.conditionallySetContents(container.querySelector(`[id="${this.uniqid}-mapping-table-body"]`), this._renderMappingTable(options));
        this._attachEventListeners();
      } else {
        debug({
          redrawHash: {before: this.redrawHash, after: redrawHash},
          lastDrawnMap: {before: this.lastDrawnMap, after: options.fullMapping}
        })
      }
    }
    this.redrawHash = redrawHash;
    this.lastDrawnMap = options.fullMapping;
    logger.groupEnd('Re-Rendering');
  }

  render(container: HTMLElement, options: UIRenderOptions): void {
    if (this.hasInitialRender) {
      this.reRender(container, options);
      return;
    }
    logger.groupCollapsed('Rendering');
    this.container = container;
    this.currentOptions = options;

    container.dataset.mappingMode = options.mappingMode;

    if (!options.headers.length) {
      container.innerHTML = this._banner('No CSV loaded. Choose a file to begin.');
      logger.groupEnd('Rendering');
      return;
    }

    const mappingTable = this._renderMappingTable(options);
    const mappingDisplay = this._renderRequiredMappingStatus(options.mappingResult);
    const validationDisplay = this._renderValidationMessages(options.validation);
    const mappingModeText = this.mappingModeText(options.mappingMode);
    const [leftHeader, rightHeader] = this.mappingModeHeaders(options.mappingMode);
    const tagText = this.tagText(options);

    container.innerHTML = `
      <div id="${this.uniqid}-mapping-display">${mappingDisplay}</div>
      <div id="${this.uniqid}-validation-display">${validationDisplay}</div>
      <div class="csvm-card">
        <div class="csvm-card-h">
          Map your columns <span class="csvm-mapping-mode" id="${this.uniqid}-mode">${mappingModeText}</span>
          <span class="csvm-tag" id="${this.uniqid}-tag">${tagText}</span>
        </div>
        <div class="csvm-card-b">
          <table class="csvm-table">
            <thead>
              <tr>
                <th id="${this.uniqid}-header-left">${leftHeader}</th>
                <th id="${this.uniqid}-header-right">${rightHeader}</th>
              </tr>
            </thead>
            <tbody id="${this.uniqid}-mapping-table-body">
              ${mappingTable}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this.hasInitialRender = true;
    logger.groupEnd('Rendering');
  }

  onMappingChange(callback: MappingChangeCallback): void {
    this.mappingChangeCallback = callback;
  }

  updateMapping(mapping: MappingResult): void {
    if (!this.container || !this.currentOptions) return;

    // Update just the validation display
    const validationElement = this.container.querySelector('.csvm-mapping-status');
    if (validationElement) {
      validationElement.outerHTML = this._renderRequiredMappingStatus(mapping);
    }
  }

  destroy(): void {
    // Clean up event listeners if needed
    this.container = null;
    this.mappingChangeCallback = null;
    this.currentOptions = null;
  }

  showMessage(message: string): void {
    if (!this.container) return;
    this.container.innerHTML = this._banner(message);
  }

  private _renderRequiredMappingStatus(mappingResult: MappingResult): string {
    const { isValid, missingRequired } = mappingResult;

    return isValid
      ? `<div class="csvm-mapping-status csvm-mapping-success">✓ All required columns are mapped</div>`
      : `<div class="csvm-mapping-status csvm-mapping-error">
          ⚠ Missing required columns: ${missingRequired.join(', ')}
        </div>`;
  }

  private _renderValidationMessages(validation: ValidationResult): string {
    if (validation.errors.length <= 0) return '';

    return `
      <details class="csvm-validation-messages">
        <summary>Validation Errors (${validation.errors.length})</summary>
        <ul>
        ${validation.errors.map(error => `<li class="csvm-validation-error">${this._escape(error.message)}</li>`).join('')}
        </ul>
      </details>
    `;
  }

  private _renderMappingTable(options: UIRenderOptions): string {
    debug('_renderMappingTable', {options});
    const fullMapping = invertMapping(options.fullMapping);
    if (options.mappingMode === 'configToCsv') {
      // Config columns on the left, CSV headers on the right
      return options.columnSpecs.map(spec => {
        let currentMapping = fullMapping[spec.name] || '';
        const selectOptions = this._generateCsvHeaderOptions(options.headers, currentMapping, fullMapping, options.allowMultipleSelection);
        this.lastDrawnMap = options.fullMapping;
        const tooltip = spec.description ? ` title="${this._escape(spec.description)}"` : '';
        const comment = spec.comment ? `\n<div class="csvm-comment">${this._escape(spec.comment)}</div>` : '';
        const multiple = spec.allowDuplicates ? ' multiple' : '';
        return `
          <tr>
            <td><strong${tooltip}>${this._escape(spec.title || spec.name)}${spec.required ? ' *' : ''}</strong>${comment}</td>
            <td>
              <select id="${this.uniqid}-${classSafeString(spec.name)}" name="${classSafeString(spec.name)}" data-src="${this._escape(spec.name)}"${tooltip}${multiple}>
                ${selectOptions}
              </select>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      // CSV headers on the left, config columns on the right (standard mode)
      return options.headers.map(header => {
        const currentMapping = options.fullMapping[header] || '';
        const selectOptions = this._generateSelectOptions(options.columnSpecs, currentMapping, fullMapping, options.allowMultipleSelection);

        // Check if this CSV header has multiple mappings (beyond the simple mapping)
        const allMappings = this._getFullMappingsForHeader(header, options);
        const hasMultipleMappings = allMappings.length > 1;
        const additionalMappingsText = (!options.allowMultipleSelection && hasMultipleMappings) ?
          ` <span class="csvm-multiple-mappings">(+${allMappings.length - 1} more: ${allMappings.slice(1).join(', ')})</span>` : '';

        const multipleAttr = options.allowMultipleSelection ? 'multiple' : '';
        const selectClass = options.allowMultipleSelection ? 'csvm-multi-select' : '';

        this.lastDrawnMap = options.fullMapping;
        return `
          <tr>
            <td><strong>${this._escape(header)}</strong></td>
            <td>
              <select id="${this.uniqid}-${classSafeString(header)}" name="${classSafeString(header)}" data-src="${this._escape(header)}" ${multipleAttr} class="${selectClass}">
                ${selectOptions}
              </select>
              ${additionalMappingsText}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  private _generateSelectOptions(columnSpecs: ColumnSpec[], currentTargetName: string|string[], allMappings: CsvMapping, allowMultipleSelection?: boolean): string {
    // Count how many times each target is used
    const usageCounts = new Map<string, number>();
    Object.values(allMappings).forEach(target => {
      if (target) {
        target = Array.isArray(target) ? target : [target];
        target.forEach(subtarget => usageCounts.set(subtarget, (usageCounts.get(subtarget) || 0) + 1));
      };
    });

    if (typeof currentTargetName === 'string') {
      currentTargetName = [currentTargetName];
    }

    const ignoreOption = '<option value="">— Ignore —</option>';

    const columnOptions = columnSpecs.map(spec => {
      const count = usageCounts.get(spec.name) || 0;
      const isCurrentTarget = currentTargetName.includes(spec.name);

      // For multiple selection mode or if duplicates are allowed, don't disable based on usage
      const canUse = allowMultipleSelection || spec.allowDuplicates === true || count === 0 || isCurrentTarget;

      const disabled = !canUse ? 'disabled' : '';
      const selected = isCurrentTarget ? 'selected' : '';
      const title = this._escape(spec.title || spec.name);
      const requiredIndicator = (spec.required && canUse) ? ' *' : '';

      return `<option class="${spec.required ? 'required' : ''}" value="${this._escape(spec.name)}" ${selected} ${disabled}>${title}${requiredIndicator}</option>`;
    });

    return [ignoreOption, ...columnOptions].join('');
  }

  private _generateCsvHeaderOptions(csvHeaders: string[], currentTargetHeader: string|string[], allMappings: CsvMapping, allowMultipleSelection?: boolean): string {
    if (!Array.isArray(currentTargetHeader)) currentTargetHeader = [currentTargetHeader];
    // In configToCsv mode, multiple config columns can map to the same CSV header
    debug({csvHeaders, currentTargetHeader, allMappings})

    const ignoreOption = '<option value="">— Ignore —</option>';

    const headerOptions = csvHeaders.map(header => {
      const isCurrentTarget = currentTargetHeader.includes(header);

      // If allowMultipleSelection is false, check if this header is already used by another config column
      let disabled = '';
      if (!allowMultipleSelection) {
        const headerAlreadyUsed = Object.entries(allMappings).some(([configCol, csvHeaders]) => {
            return csvHeaders.includes(header);
          }
        );
        if (headerAlreadyUsed && !isCurrentTarget) {
          disabled = 'disabled';
        }
      }

      const selected = isCurrentTarget ? 'selected' : '';
      const headerText = this._escape(header);

      return `<option value="${this._escape(header)}" ${selected} ${disabled}>${headerText}</option>`;
    });

    return [ignoreOption, ...headerOptions].join('');
  }

  private _attachEventListeners(): void {
    if (!this.container || !this.mappingChangeCallback) return;
    debug('Attaching event listeners');

    const selectElements = this.container.querySelectorAll('select[data-src]') as NodeListOf<HTMLSelectElement>;

    selectElements.forEach(select => {
      select.addEventListener('change', (event) => {
        let sourceHeader: string|null = select.getAttribute('data-src');
        const selectedOptions = Array.from(select.selectedOptions).map(o => o.value);
        debug('Select changed', {
          sourceHeader,
          value: select.value,
          selectedOptions
        });
          if (!sourceHeader) return;

        if (this.container?.dataset.mappingMode === 'configToCsv') {
          // In configToCsv mode: data-src=configColumn, value=csvHeader
          if (this.mappingChangeCallback) {
            this.lastDrawnMap = this.mappingChangeCallback(sourceHeader, selectedOptions);
          }
        } else {
          if (this.mappingChangeCallback) {
            this.lastDrawnMap = this.mappingChangeCallback(sourceHeader, selectedOptions);
          }
        }
      });
    });
  }

  private _banner(text: string): string {
    return `<div class="csvm-note">${this._escape(text)}</div>`;
  }

  private _escape(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private _getFullMappingsForHeader(header: string, options: UIRenderOptions): string[] {
    if (!options.fullMapping || !options.fullMapping[header]) {
      return [];
    }

    const mapping = options.fullMapping[header];
    if (typeof mapping === 'string') {
      return [mapping];
    } else {
      return [...mapping];
    }
  }

  private static _ensureStyles(): void {
    const id = 'csv-mapper-styles';
    if (document.getElementById(id)) return;

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
      .csvm-comment {
        font-size: 0.8rem;
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
      .csvm-table select.csvm-multi-select {
        min-height: 80px;
      }
      .csvm-tag {
        background: #007cba;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.85em;
        font-weight: normal;
      }
      .csvm-mapping-mode {
        background: #28a745;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.85em;
        font-weight: normal;
        margin-right: 8px;
      }
      .csvm-note {
        padding: 12px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        color: #6c757d;
      }
      .csvm-mapping-status, .csvm-validation-messages {
        padding: 8px 12px;
        margin-bottom: 10px;
        border-radius: 4px;
        font-weight: 500;
      }
      .csvm-mapping-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }
      .csvm-mapping-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      .csvm-validation-messages {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      .csvm-validation-error {
        padding: 4px 0;
      }
      .csvm-table select option.required:not(:disabled) {
        font-weight: bold;
        color: #721c24;
      }
      .csvm-multiple-mappings {
        font-size: 0.85em;
        color: #007cba;
        font-weight: normal;
        margin-left: 8px;
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
        .csvm-table select.csvm-multi-select {
          min-height: 80px;
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
        .csvm-mapping-success {
          background: #1e3a1e;
          border: 1px solid #2d5a2d;
          color: #4caf50;
        }
        .csvm-mapping-error {
          background: #3a1e1e;
          border: 1px solid #5a2d2d;
          color: #f44336;
        }
        .csvm-validation-messages {
          background: #3a1e1e;
          border: 1px solid #5a2d2d;
          color: #f44336;
        }
        .csvm-table select option.required:not(:disabled) {
          color: #f44336;
        }
        .csvm-multiple-mappings {
          color: #0099e6;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
