import { UIRenderer, UIRenderOptions, MappingResult } from './../../types.js';
/**
 * Minimal UI renderer with a simpler, more compact interface
 * Good example of how to create alternative renderers
 */
export declare class MinimalUIRenderer implements UIRenderer {
    private container;
    private mappingChangeCallback;
    constructor();
    render(container: HTMLElement, options: UIRenderOptions): void;
    onMappingChange(callback: (sourceHeader: string, targetColumn: string) => void): void;
    updateMapping(validation: MappingResult): void;
    destroy(): void;
    showMessage(message: string): void;
    private _renderRequiredMappingsBadge;
    private _renderValidationMessages;
    private _renderMappingRows;
    private _renderMappingRow;
    private _renderConfigToCSVMappingRow;
    private _generateOptions;
    private _generateHeaderOptions;
    private _attachEventListeners;
    private _escape;
    private static _ensureStyles;
}
//# sourceMappingURL=minimal.d.ts.map