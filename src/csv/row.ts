export class CsvRow implements Iterator<any> {
    public index: number = 0;
    public data: any[];
    public headers: null|string[];
    private iterIndex: number = 0;
    private genIndex: number = 0;
    constructor(index: number, data: any[], headers: null|string[] = null) {
        this.index = index;
        this.headers = headers;
        this.data = data;
        if (this.headers) {
            this._checkHeaderLength();
        }
    }

    private _checkHeaderLength()
    {
        if (this.headers) {
            if (this.headers.length < this.data.length) {
                throw new Error('Not enough headers for data');
            }
            if (this.headers.length > this.data.length) {
                throw new Error('Too many headers for data');
            }
        }
    }

    get(idx: string|number): any|any[] {
        if (typeof idx === 'number') {
            return this.data[idx] ?? null;
        }
        if (!this.headers) {
            throw new Error(`Cannot get header "${idx}" by name without headers`);
        }
        const values: any[] = [];
        this.headers.forEach((ourHeader, ourIndex) => {
            if (idx === ourHeader) {
                values.push(this.data[ourIndex]);
            }
        });
        if (values.length === 0) {
            return null;
        }
        if (values.length === 1) {
            return values[0];
        }
        return values;
    }

    set(idx: string|number, value: any): this {
        if (typeof idx === 'number') {
            this.data[idx] = value;
        } else if (this.headers) {
            this.headers.forEach((ourHeader, ourIndex) => {
                if (idx === ourHeader) {
                    this.data[ourIndex] = value;
                }
            });
        } else {
            throw new Error(`Cannot set header "${idx}" by name without headers`);
        }
        return this;
    }

    /** Special Iterator functions */
    [Symbol.iterator](): IterableIterator<[string|number, any]> {
        return this;
    }

    next(): IteratorResult<any> {
        if (this.iterIndex < this.data.length) {
            return { value:this.data[this.iterIndex++], done: false };
        }
        return { done: true, value: undefined };
    }

    return(value: any): IteratorResult<any> {
        this.iterIndex = 0;
        return { done: true, value };
    }

    throw(exception: any): IteratorResult<any> {
        this.iterIndex = 0;
        return { done: true, value: undefined };
    }
    /** end Special Iterator functions */

    *entries() {
        let idx = 0;
        while (idx < this.data.length) {
            if (this.headers) {
                yield [idx, this.data[idx], this.headers[idx]];
            } else {
                yield [idx, this.data[idx], null];
            }
            idx++;
        }
    }

    arrange(headers: string[]) {
        if (this.headers) {
            const ourHeaders = this.headers.slice();
            const ourData = this.data.slice();
            const outData : any[] = [];
            for (const header of headers) {
                const index = ourHeaders.indexOf(header);
                if (index === -1) {
                    throw new Error(`Header "${header}" not found`);
                }
                if (typeof ourData[index] === 'undefined') {
                    throw new Error(`Data at at index ${index} for header "${header}" not found`);
                }
                outData.push(ourData[index]);
                ourHeaders.splice(index, 1);
                ourData.splice(index, 1);
            }
            return outData;
        }
        throw new Error('Headers not defined - cannot arrange');
    }

    toPlainObject(): Record<string|number, any|any[]> {
        if (!this.headers) {
            return this.data;
        }
        const out = {} as Record<string, any|any[]>;
        if (this.headers) {
            for (const idx in this.headers) {
                const header = this.headers[idx];
                if (typeof out[header] !== 'undefined') {
                    if (Array.isArray(out[header])) {
                        out[header].push(this.data[idx] ?? null);
                    } else {
                        out[header] = [out[header], this.data[idx] ?? null];
                    }
                } else {
                    out[header] = this.data[idx] ?? null;
                }
            }
        }
        return out;
    }
}