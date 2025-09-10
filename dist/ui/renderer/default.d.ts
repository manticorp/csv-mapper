import { UIRenderer, UIRenderOptions, MappingResult, CsvMapping } from '../../types.js';
/**
 * Default HTML-based UI renderer for CSV Mapper
 * Provides the classic dropdown-based mapping interface
 */
export declare class DefaultUIRenderer implements UIRenderer {
    private container;
    private mappingChangeCallback;
    private currentOptions;
    private uniqid;
    private hasInitialRender;
    private lastDrawnMap;
    private redrawHash;
    constructor();
    reset(): this;
    protected conditionallySetContents(container: HTMLElement | null, content: string): void;
    protected hashesAreEquivalent(a: Record<string, any>, b: Record<string, any>): boolean;
    protected mappingModeHeaders(mode: string): string[];
    protected mappingModeText(mode: string): "(Config → CSV)" | "(CSV → Config)";
    protected tagText(options: UIRenderOptions): string;
    reRender(container: HTMLElement, options: UIRenderOptions): void;
    render(container: HTMLElement, options: UIRenderOptions): void;
    onMappingChange(callback: (sourceHeader: string, targetColumn: string) => CsvMapping): void;
    updateMapping(mapping: MappingResult): void;
    destroy(): void;
    showMessage(message: string): void;
    private _renderRequiredMappingStatus;
    private _renderValidationMessages;
    private _renderMappingTable;
    private _generateSelectOptions;
    private _generateCsvHeaderOptions;
    private _attachEventListeners;
    private _banner;
    private _escape;
    private _getFullMappingsForHeader;
    private static _ensureStyles;
}
//# sourceMappingURL=default.d.ts.map