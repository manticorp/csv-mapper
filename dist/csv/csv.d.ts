import { CsvRow } from './row.js';
export interface UnparseConfig {
    quotes: boolean | boolean[];
    quoteChar: string;
    escapeChar: string;
    delimiter: string;
    header: boolean;
    newline: string;
    skipEmptyLines: boolean;
    columns: string[];
}
export declare class Csv implements Iterator<CsvRow> {
    private index;
    rows: any[];
    headers: null | string[];
    get length(): number;
    constructor(rows?: any[][], headers?: string[] | null | undefined);
    clone(): Csv;
    has(): boolean;
    row(index: number): CsvRow;
    current(): CsvRow;
    nextRow(): CsvRow;
    /** Special Iterator functions */
    [Symbol.iterator](): this;
    next(): IteratorResult<CsvRow>;
    return(value: any): IteratorResult<CsvRow>;
    throw(exception: any): IteratorResult<CsvRow>;
    /** end Special Iterator functions */
    rewind(): this;
    map(fn: (row: any[], rowIndex: number, headers: null | string[]) => any[]): Csv;
    forEach(fn: (row: any[], rowIndex: number, headers: null | string[]) => any[]): Csv;
    mapRows(fn: (row: CsvRow, headers: null | string[]) => CsvRow): Csv;
    arrange(headers: string[]): Csv;
    toPlainObjects(): Record<string, any | any[]>[] | any[][];
    toRows(): Record<string, any | any[]>[] | any[][];
    toString(options?: Partial<UnparseConfig>): string;
    addColumn(nameOrIndex: string | number, where?: string | number | null, defaultValue?: any | any[]): this;
    renameColumn(from: string, to: string): this;
    remap(mapping: Record<string, string>[]): this;
    remapColumns(mapping: [string | number, string | string[]][]): this;
    remapColumns(mapping: Record<string, string | string[]>): this;
    remapColumn(source: number, to: string | string[]): this;
    remapColumn(source: string, to: string | string[]): this;
    remapped(mapping: Record<string, string>[]): Csv;
    removeColumn(name: string | number): void;
    reorderColumns(order: ReadonlyArray<number>): this;
    reorderColumns(order: ReadonlyArray<string>): this;
}
//# sourceMappingURL=csv.d.ts.map