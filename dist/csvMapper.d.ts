import { CsvDialect, ColumnSpec, CsvMapperOptions, ParseOptions, ParseResult, DetectDialectOptions, MappedOutput, UIRenderer, CsvParser, CsvMapping, RequiredColumnValidationResult, DataTransformer } from './types.js';
import { DefaultUIRenderer } from './ui/renderer/default.js';
import { Csv } from './csv/csv.js';
export * from './types.js';
export interface CsvMapperOpts extends Omit<CsvMapperOptions, 'columns'> {
}
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
    input: HTMLInputElement | null;
    /**
     * The currently set options. Caution: setting these
     * might not change the behaviour correctly, and should
     * not be set directly.
     */
    opts: CsvMapperOpts;
    /**
     * The currently set columns
     */
    columns: ColumnSpec[];
    /**
     * The controls element (if any) where the UI is rendered.
     *
     * This will be the element passed in the controlsContainer
     * option if set, or dynamically created at runtime.
     */
    controlsEl: HTMLElement | null;
    /**
     * The current CSV column mapping from CSV header to config column(s)
     */
    private mapping;
    /**
     * The parsed CSV headers.
     */
    get headers(): string[];
    /**
     * The parsed CSV dialect.
     */
    private dialect;
    /**
     * Whether the current mapping and data is valid.
     */
    isValid: boolean;
    /**
     * The input CSV as a Csv object.
     */
    csv: Csv | null;
    /**
     * The renderer for the UI.
     */
    private uiRenderer;
    /**
     * The CSV parser.
     */
    private parser;
    /**
     * The data transformer and validator for the CSV data.
     */
    private transformer;
    /**
     * @param fileInputOrOptions selector or element for file input, or options if no file input required
     * @param options configuration options
     */
    constructor(fileInputOrOptions: HTMLInputElement | string | CsvMapperOptions, options?: CsvMapperOptions);
    destroy(): void;
    getHeaders(): string[];
    /**
     * Gets the detected dialect of the currently loaded CSV.
     */
    getDialect(): CsvDialect;
    setColumns(columns?: (ColumnSpec | string)[]): void;
    getMapping(): CsvMapping;
    /**
     * Sets the mapping for CSV headers to config columns.
     * @param map Mapping object in either simple (string) or advanced (array) format
     *
     * @example
     * mapper.setMapping({'CSV Header': 'config_column'});
     * mapper.setMapping({'CSV Header': ['config_column1', 'config_column2']});
     */
    setMapping(map: Record<string, string | string[]> | null): void;
    resetColumnMapping(): void;
    addColumnMappings(mappings: Record<string, string>[]): void;
    addColumnMapping(csvHeader: string, configColumn: string): void;
    removeColumnMapping(csvHeader: string, configColumn: string): void;
    clearColumnMapping(csvHeader: string): void;
    getColumnMappings(csvHeader: string): string[];
    getAllMappings(): Record<string, string[]>;
    getParser(): CsvParser;
    setParser(parser: CsvParser): void;
    getUiRenderer(): UIRenderer;
    setUiRenderer(uiRenderer: UIRenderer | string | null | undefined): void;
    getTransformer(): DataTransformer;
    setTransformer(dataTransformer: DataTransformer): void;
    /**
     * Sets a CSV via a File object (usually from a file input)
     */
    setFile(file: File): Promise<void>;
    /**
     * Sets the CSV text to be used.
     *
     * This will parse the CSV set the csv property appropriately.
     *
     * @group Main Methods
     */
    setCsv(csvText: string): this;
    autoMap(): void;
    render(): void;
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
    mapCsv(csvText?: string): MappedOutput | false;
    remap(): boolean;
    getMappedResult(): MappedOutput | void;
    private _replaceInputFileWithCsv;
    private _tryReplaceFileList;
    private _resolveUiRenderer;
    private _onFileChange;
    private _autoMap;
    private _validateMapping;
    private _onMappingChange;
    private _mappingChangeEvent;
    /**
     * Checks if all required columns are mapped
     * @returns Object with validation status and missing required columns
     */
    validateRequiredColumns(): RequiredColumnValidationResult;
    private _addMapping;
    private _removeMapping;
    private _clearMapping;
    private _getMappedColumns;
    private _getAllMappedTargets;
    private _getSimpleMapping;
    private _getReverseMapping;
    private _produceOutput;
    private _renderControls;
    redraw(): void;
    private _getMappingStatus;
    private _resolveNode;
    private _autoinsertContainer;
    static parseCSV(text: string, options?: ParseOptions): ParseResult;
    static detectDialect(text: string, options?: DetectDialectOptions): CsvDialect;
    static DefaultUIRenderer: typeof DefaultUIRenderer;
}
//# sourceMappingURL=csvMapper.d.ts.map