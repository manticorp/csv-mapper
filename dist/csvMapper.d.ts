import { CsvDialect, ColumnSpec, ValidationResult, ValidationType, ValidationRule, CsvMapperOptions, ParseOptions, ParseResult, DetectDialectOptions, MappedOutput, UIRenderer, CsvParser, CsvMapping } from './types.js';
import { DataTransformer } from './transform/dataTransformer.js';
import { DefaultUIRenderer } from './ui/renderer/default.js';
import { Csv } from './csv/csv.js';
export * from './types.js';
export default class CsvMapper extends EventTarget {
    input: HTMLInputElement | null;
    opts: CsvMapperOptions;
    columns: ColumnSpec[];
    controlsEl: HTMLElement | null;
    mapping: CsvMapping;
    headers: string[];
    dialect: CsvDialect;
    uiRenderer: UIRenderer;
    parser: CsvParser;
    isValid: boolean;
    csv: Csv | null;
    transformer: DataTransformer;
    /**
     * @param fileInput selector or element for <input type=file>
     * @param options configuration options
     */
    constructor(fileInput: HTMLInputElement | string | CsvMapperOptions, options?: CsvMapperOptions);
    destroy(): void;
    getMapping(): CsvMapping;
    setMapping(map: Record<string, string | string[]> | null): void;
    getHeaders(): string[];
    getRawRows(): Record<string, string>[];
    getDialect(): CsvDialect;
    redraw(): void;
    setColumns(columns?: (ColumnSpec | string)[]): void;
    resetColumnMapping(): void;
    addColumnMappings(mappings: Record<string, string>[]): void;
    addColumnMapping(csvHeader: string, configColumn: string): void;
    removeColumnMapping(csvHeader: string, configColumn: string): void;
    clearColumnMapping(csvHeader: string): void;
    getColumnMappings(csvHeader: string): string[];
    getAllMappings(): Record<string, string[]>;
    setUiRenderer(uiRenderer: UIRenderer | string | null | undefined): void;
    setCsv(csvText: string): this;
    mapCsv(csvText?: string): MappedOutput | false;
    getMappedResult(): MappedOutput | void;
    _resolveUiRenderer(uiRenderer: UIRenderer | string | null | undefined): UIRenderer;
    _onFileChange(): Promise<void>;
    private _beforeParseCsv;
    private _afterParseCsv;
    private _autoMap;
    _validateMapping(): {
        isValid: boolean;
        missingRequired: string[];
        mappedTargets: string[];
    };
    _onMappingChange(): void;
    _mappingChangeEvent(): void;
    /**
     * Checks if all required columns are mapped
     * @returns Object with validation status and missing required columns
     */
    validateRequiredColumns(): {
        isValid: boolean;
        missingRequired: string[];
        mappedTargets: string[];
    };
    addMapping(csvHeader: string, configColumn: string): void;
    removeMapping(csvHeader: string, configColumn: string): void;
    clearMapping(csvHeader: string): void;
    getMappedColumns(csvHeader: string): string[];
    getAllMappedTargets(): string[];
    getSimpleMapping(): Record<string, string>;
    getReverseMapping(): Record<string, string>;
    _produceOutput(): MappedOutput;
    _renderControls(validation?: ValidationResult): void;
    private _getMappingStatus;
    _banner(text: string): string;
    _resolveNode(ref: HTMLElement | string | null): HTMLElement | null;
    _autoinsertContainer(): HTMLDivElement | null;
    static parseCSV(text: string, options?: ParseOptions): ParseResult;
    static detectDialect(text: string, options?: DetectDialectOptions): CsvDialect;
    static toCsvRow(arr: any[], sep?: string, quote?: string, esc?: string | null): string;
    static _validateValue(fieldValue: any, validator: RegExp | ((value: any) => boolean) | ValidationRule | ValidationType): boolean;
    static dateFormatToRegex(format: string, { anchors, allowUppercaseMD, }?: {
        anchors?: boolean | undefined;
        allowUppercaseMD?: boolean | undefined;
    }): RegExp;
    static _validateRegex(value: any, regex: RegExp): boolean;
    static escape(s: any): string;
    static DefaultUIRenderer: typeof DefaultUIRenderer;
}
//# sourceMappingURL=csvMapper.d.ts.map