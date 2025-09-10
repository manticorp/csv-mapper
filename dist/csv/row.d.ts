export declare class CsvRow implements Iterator<any> {
    index: number;
    data: any[];
    headers: null | string[];
    private iterIndex;
    private genIndex;
    constructor(index: number, data: any[], headers?: null | string[]);
    private _checkHeaderLength;
    get(idx: string | number): any | any[];
    set(idx: string | number, value: any): this;
    /** Special Iterator functions */
    [Symbol.iterator](): IterableIterator<[string | number, any]>;
    next(): IteratorResult<any>;
    return(value: any): IteratorResult<any>;
    throw(exception: any): IteratorResult<any>;
    /** end Special Iterator functions */
    entries(): Generator<any[], void, unknown>;
    arrange(headers: string[]): any[];
    toPlainObject(): Record<string | number, any | any[]>;
}
//# sourceMappingURL=row.d.ts.map