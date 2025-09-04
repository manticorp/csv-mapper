import { UIRenderer, UIRenderOptions, ValidationResult, ColumnSpec } from '../../types.js';

/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
export class DefaultUIRenderer implements UIRenderer {
  private container: HTMLElement | null = null;
  private mappingChangeCallback: ((sourceHeader: string, targetColumn: string) => void) | null = null;
  private currentOptions: UIRenderOptions | null = null;

  constructor() {
    // Ensure CSS is loaded
    DefaultUIRenderer._ensureStyles();
  }

  render(container: HTMLElement, options: UIRenderOptions): void {
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

  onMappingChange(callback: (sourceHeader: string, targetColumn: string) => void): void {
    this.mappingChangeCallback = callback;
  }

  updateValidation(validation: ValidationResult): void {
    if (!this.container || !this.currentOptions) return;
    
    // Update just the validation display
    const validationElement = this.container.querySelector('.csvm-validation-status');
    if (validationElement) {
      validationElement.outerHTML = this._renderValidationStatus(validation);
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

  private _renderValidationStatus(validation: ValidationResult): string {
    const { isValid, missingRequired } = validation;
    
    return isValid
      ? `<div class="csvm-validation-status csvm-validation-success">✓ All required columns are mapped</div>`
      : `<div class="csvm-validation-status csvm-validation-error">
          ⚠ Missing required columns: ${missingRequired.join(', ')}
        </div>`;
  }

  private _renderMappingTable(options: UIRenderOptions): string {
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

  private _generateSelectOptions(columnSpecs: ColumnSpec[], currentTargetName: string, allMappings: Record<string, string>): string {
    // Count how many times each target is used
    const usageCounts = new Map<string, number>();
    Object.values(allMappings).forEach(target => {
      if (target) usageCounts.set(target, (usageCounts.get(target) || 0) + 1);
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

  private _banner(text: string): string {
    return `<div class="csvm-note">${this._escape(text)}</div>`;
  }

  private _escape(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
