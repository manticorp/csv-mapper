import { UIRenderer, UIRenderOptions, ValidationResult } from '../../types.js';

/**
 * Minimal UI renderer with a simpler, more compact interface
 * Good example of how to create alternative renderers
 */
export class MinimalUIRenderer implements UIRenderer {
  private container: HTMLElement | null = null;
  private mappingChangeCallback: ((sourceHeader: string, targetColumn: string) => void) | null = null;

  constructor() {
    MinimalUIRenderer._ensureStyles();
  }

  render(container: HTMLElement, options: UIRenderOptions): void {
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

  onMappingChange(callback: (sourceHeader: string, targetColumn: string) => void): void {
    this.mappingChangeCallback = callback;
  }

  updateValidation(validation: ValidationResult): void {
    if (!this.container) return;
    
    const badge = this.container.querySelector('.minimal-validation-badge');
    if (badge) {
      badge.outerHTML = this._renderValidationBadge(validation);
    }
  }

  destroy(): void {
    this.container = null;
    this.mappingChangeCallback = null;
  }

  showMessage(message: string): void {
    if (!this.container) return;
    this.container.innerHTML = `<div class="minimal-note">${this._escape(message)}</div>`;
  }

  private _renderValidationBadge(validation: ValidationResult): string {
    const { isValid, missingRequired } = validation;
    const className = isValid ? 'minimal-validation-badge valid' : 'minimal-validation-badge invalid';
    const text = isValid ? '✓' : `⚠ ${missingRequired.length}`;
    const title = isValid ? 'All required columns mapped' : `Missing: ${missingRequired.join(', ')}`;
    
    return `<span class="${className}" title="${this._escape(title)}">${text}</span>`;
  }

  private _renderMappingRow(header: string, columnSpecs: any[], currentMapping: Record<string, string>): string {
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

  private _generateOptions(columnSpecs: any[], currentTarget: string): string {
    const ignoreOption = '<option value="">—</option>';
    const columnOptions = columnSpecs.map(spec => {
      const selected = currentTarget === spec.name ? 'selected' : '';
      const title = spec.title || spec.name;
      return `<option value="${this._escape(spec.name)}" ${selected}>${this._escape(title)}</option>`;
    });
    
    return [ignoreOption, ...columnOptions].join('');
  }

  private _attachEventListeners(): void {
    if (!this.container || !this.mappingChangeCallback) return;

    const selectElements = this.container.querySelectorAll('select[data-src]') as NodeListOf<HTMLSelectElement>;
    
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

  private _escape(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private static _ensureStyles(): void {
    const id = 'minimal-ui-styles';
    if (document.getElementById(id)) return;

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
