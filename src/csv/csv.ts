import { CsvRow } from './row.js';

import Papa from 'papaparse';

export interface UnparseConfig {
	quotes: boolean|boolean[];
	quoteChar: string;
	escapeChar: string;
	delimiter: string;
	header: boolean,
	newline: string,
	skipEmptyLines: boolean,
	columns: string[]
}

export class Csv implements Iterator<CsvRow> {
    private index = 0;
    public rows: any[] = [];
    public headers: null|string[];
    get length(): number {
        return this.rows.length;
    }

    constructor (rows: any[][] = [], headers: string[]|null|undefined = null) {
        this.rows = rows;
        this.headers = headers;
    }

    clone(): Csv {
        return new Csv(this.rows.map(r => r.slice()), this.headers ? this.headers.slice() : null);
    }

    has(): boolean {
        return this.index < this.rows.length;
    }

    current(): CsvRow {
        return new CsvRow(this.index, this.rows[this.index], this.headers);
    }

    nextRow(): CsvRow {
        return new CsvRow(this.index, this.rows[this.index++], this.headers);
    }

    /** Special Iterator functions */
    [Symbol.iterator]() {
        return this;
    }

    next(): IteratorResult<CsvRow> {
        if (this.has()) {
            return { done: false, value: this.nextRow() };
        }
        return { done: true, value: undefined };
    }

    return(value: any): IteratorResult<CsvRow> {
        this.rewind();
        return {done: true, value};
    }

    throw(exception: any): IteratorResult<CsvRow> {
        this.rewind();
        return {done: true, value: undefined};
    }
    /** end Special Iterator functions */

    rewind() {
        this.index = 0;
        return this;
    }

    map(fn: (row: any[], rowIndex:number, headers: null|string[]) => any[]): Csv {
        const headers = this.headers ? this.headers.slice() : null;
        const newRows = this.rows.map((row, rowIndex) => fn(row, rowIndex, headers));
        return new Csv(newRows, headers);
    }

    forEach(fn: (row: any[], rowIndex:number, headers: null|string[]) => any[]): Csv {
        const headers = this.headers ? this.headers.slice() : null;
        this.rows.forEach((row, rowIndex) => fn(row, rowIndex, headers));
        return this;
    }

    mapRows(fn: (row: CsvRow, headers: null|string[]) => CsvRow): Csv {
        const newRows = this.rows.map((row, rowIndex) => fn(new CsvRow(rowIndex, row, this.headers), this.headers).data);
        return new Csv(newRows, this.headers);
    }

    arrange(headers: string[]): Csv {
        const newRows = [];
        for (const row of this) {
            newRows.push(row.arrange(headers));
        }
        return new Csv(newRows, headers);
    }

    toPlainObjects(): Record<string, any|any[]>[]|any[][] {
        const rows = [];
        for (const row of this) {
            rows.push(row.toPlainObject());
        }
        return rows;
    }

    toRows(): Record<string, any|any[]>[]|any[][] {
        const rows = [];
        if (this.headers) {
            rows.push(this.headers);
        }
        return [...rows, ...this.rows];
    }

    toString(options: Partial<UnparseConfig> = {}): string {
        const rows = this.toRows();
        if (this.headers && !(options.header ?? true)) {
            rows.shift();
        }
        return Papa.unparse(rows, options);
    }

    addColumn(nameOrIndex:string|number, where: string|number|null = null, defaultValue:any|any[] = null): this {
        if (where === null) {
            if (typeof nameOrIndex === 'number') {
                where = nameOrIndex;
            } else {
                where = this.headers?.length ?? -1;
            }
        }
        if (typeof where === 'string' ){
            if (this.headers) {
                let idx = this.headers.lastIndexOf(where);
                if (idx === -1) {
                    throw new Error(`Missing column "${where}"`);
                }
                where = idx + 1;
            } else {
                where = -1;
            }
        }
        this.headers?.splice(where, 0, String(nameOrIndex));
        for (const row of this.rows) {
            row.splice(where, 0, defaultValue);
        }
        return this;
    }

    renameColumn(from:string, to: string) {
        this.headers = this.headers?.map(h => h === from ? to : h) || null;
        return this;
    }

    remap(mapping: Record<string, string>[]) {
        mapping.forEach(({from, to}) => this.renameColumn(from, to));
        return this;
    }

    remapColumns(mapping: [string|number, string|string[]][]): this;
    remapColumns(mapping: Record<string, string|string[]>): this;
    remapColumns(mapping: [string|number, string|string[]][]|Record<string, string|string[]>): this {
        if (Array.isArray(mapping)) {
            mapping.forEach(([source, to]) => {
                if (typeof source === 'number') {
                    this.remapColumn(source, to);
                } else {
                    this.remapColumn(source, to);
                }
            });
        } else {
            Object.entries(mapping).forEach(([source, to]) => this.remapColumn(source, to));
        }
        return this;
    }

    remapColumn(source: number, to: string | string[]): this;
    remapColumn(source: string, to: string | string[]): this;

    remapColumn(source: number | string, to: string | string[]): this {
        const hasHeaders = Array.isArray(this.headers) && this.headers.length > 0;
        const rowCount = Array.isArray(this.rows) ? this.rows.length : 0;
        const colCount = this.rows?.[0]?.length ?? (hasHeaders ? this.headers!.length : 0);
        if (colCount === 0) return this;

        const toNames = Array.isArray(to) ? [...to] : [to];
        if (toNames.length === 0) return this;

        // Resolve current source indices (supports duplicates for name source)
        const resolveIndices = (): number[] => {
            if (typeof source === 'number') {
            const idx = source < 0 ? colCount + source : source;
            if (!Number.isInteger(idx) || idx < 0 || idx >= colCount) {
                throw new Error(`remapColumn: index out of range: ${source}`);
            }
            return [idx];
            }
            if (!hasHeaders) {
            throw new Error(`remapColumn: cannot use header names without headers (got "${source}")`);
            }
            const indices: number[] = [];
            this.headers!.forEach((h, i) => {
            if (h === source) indices.push(i);
            });
            if (indices.length === 0) {
            throw new Error(`remapColumn: header not found: "${source}"`);
            }
            return indices;
        };

        const srcIdxs = resolveIndices();

        // Snapshot source columns' values now to avoid interference while appending
        const takeColumn = (idx: number): any[] =>
            Array.from({ length: rowCount }, (_, r) => this.rows?.[r]?.[idx]);

        if (srcIdxs.length === 1) {
            const src = srcIdxs[0];
            const srcVals = takeColumn(src);

            // Rename to first name
            if (hasHeaders) this.headers![src] = toNames[0];

            // Append duplicates for remaining names
            for (let k = 1; k < toNames.length; k++) {
            const name = toNames[k];
            if (hasHeaders) this.headers!.push(name);
            for (let r = 0; r < rowCount; r++) {
                this.rows![r].push(srcVals[r]);
            }
            }
            return this;
        }

        // Multiple sources
        if (toNames.length === 1) {
            // Rename each source to the same target
            const name = toNames[0];
            if (hasHeaders) {
            for (const i of srcIdxs) this.headers![i] = name;
            }
            return this;
        }

        if (toNames.length !== srcIdxs.length) {
            throw new Error(
            `remapColumn: mismatched arity (sources=${srcIdxs.length}, targets=${toNames.length}). ` +
            `Use a single target name to rename all, or match lengths.`
            );
        }

        // One-to-one rename (no duplication)
        if (hasHeaders) {
            srcIdxs.forEach((i, k) => (this.headers![i] = toNames[k]));
        }
        return this;
    }

    remapped(mapping: Record<string, string>[]) {
        return this.clone().remap(mapping);
    }

    removeColumn(name: string|number) {
        if (typeof name === 'number') {
            if (this.headers) {
                this.headers.splice(name, 1);
            }
            this.rows.forEach(row => row.splice(name, 1));
        } else if (this.headers) {
            let index;
            index = this.headers?.indexOf(name);
            while (typeof index !== 'undefined' && index > -1) {
                this.removeColumn(index);
                index = this.headers?.indexOf(name);
            }
        } else {
            throw new Error('Cannot remove header by name without headers present.');
        }
    }

    // Overloads
    reorderColumns(order: ReadonlyArray<number>): this;
    reorderColumns(order: ReadonlyArray<string>): this;

    reorderColumns(order: ReadonlyArray<number | string>): this {
        const hasHeaders = Array.isArray(this.headers) && this.headers.length > 0;
        const colCount =
            this.rows?.[0]?.length ??
            (hasHeaders ? this.headers!.length : 0);

        if (!Array.isArray(order) || order.length === 0) return this;
        if (colCount === 0) return this;

        // Build lookup of header -> queue of indices (handles duplicates)
        const nameToIndices = new Map<string, number[]>();
        if (hasHeaders) {
            this.headers!.forEach((name, i) => {
            const arr = nameToIndices.get(name) ?? [];
            arr.push(i);
            nameToIndices.set(name, arr);
            });
        }

        const seen = new Set<number>();
        const indices: number[] = [];

        const takeIndex = (i: number) => {
            if (!seen.has(i)) {
            seen.add(i);
            indices.push(i);
            }
        };

        for (const key of order) {
            if (typeof key === 'number') {
            let idx = key < 0 ? colCount + key : key;
            if (!Number.isInteger(idx) || idx < 0 || idx >= colCount) {
                throw new Error(`reorderColumns: index out of range: ${key}`);
            }
            takeIndex(idx);
            } else {
            if (!hasHeaders) {
                throw new Error(
                `reorderColumns: cannot use header names without headers (got "${key}")`
                );
            }
            const queue = nameToIndices.get(key);
            if (!queue || queue.length === 0) {
                throw new Error(`reorderColumns: unknown header "${key}"`);
            }
            // Pull ALL remaining occurrences for this name, in order
            while (queue.length) {
                takeIndex(queue.shift()!);
            }
            }
        }

        // Append any unspecified columns in original order
        for (let i = 0; i < colCount; i++) {
            if (!seen.has(i)) indices.push(i);
        }

        // Apply reorder
        if (hasHeaders) {
            this.headers = indices.map(i => this.headers![i]);
        }
        if (Array.isArray(this.rows)) {
            this.rows = this.rows.map(row => indices.map(i => row[i]));
        }
        return this;
    }

}