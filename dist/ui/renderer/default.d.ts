import { UIRenderer, UIRenderOptions, ValidationResult } from '../../types.js';
/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
export declare class DefaultUIRenderer implements UIRenderer {
    private container;
    private mappingChangeCallback;
    private currentOptions;
    constructor();
    render(container: HTMLElement, options: UIRenderOptions): void;
    onMappingChange(callback: (sourceHeader: string, targetColumn: string) => void): void;
    updateValidation(validation: ValidationResult): void;
    destroy(): void;
    showMessage(message: string): void;
    private _renderValidationStatus;
    private _renderMappingTable;
    private _generateSelectOptions;
    private _attachEventListeners;
    private _banner;
    private _escape;
    private static _ensureStyles;
}
//# sourceMappingURL=default.d.ts.map