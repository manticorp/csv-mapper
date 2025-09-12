import { CsvMapping } from "./types";
export declare const IS_DEBUG: boolean;
export declare const limitString: (str: string, length: number, rest?: string) => string;
export declare const stringFormat: (str: string, format: Record<string, any>) => string;
export declare const normalize: (s: any) => string;
export declare const similarity: (a: string, b: string) => number;
export declare const classSafeString: (str: string) => string;
export declare const logger: Console | {
    log: (...args: any[]) => void;
    group: (...args: any[]) => void;
    groupCollapsed: (...args: any[]) => void;
    groupEnd: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    table: (...args: any[]) => void;
};
export declare const debug: (...args: any[]) => void;
export declare const debugTable: ((...args: any[]) => void) | {
    (tabularData?: any, properties?: string[]): void;
    (tabularData: any, properties?: readonly string[]): void;
};
export declare const isNodeEl: (x: any) => x is Element;
export declare const isHtmlInput: (x: any) => x is HTMLInputElement;
export declare const isPlainObject: (x: any) => x is Record<string, unknown>;
export declare const invertMapping: (mapping: CsvMapping) => CsvMapping;
//# sourceMappingURL=helpers.d.ts.map