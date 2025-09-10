// @ts-ignore - This will be replaced by Rollup
const NODE_ENV = process.env.NODE_ENV;
export const IS_DEBUG = NODE_ENV === 'development';

export const limitString = (str: string, length: number, rest: string = '...') => {
    if (str.length <= length) return str;
    return str.slice(0, length - rest.length) + rest;
};

export const stringFormat = (str: string, format: Record<string, any>) => {
    return str.replace(/{(\w+)}/g, (match, key) => {
        const value = format[key];
        return value != null ? String(value) : match;
    });
};

export const normalize = (s: any): string => String(s || '').toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();

export const similarity = (a: string, b: string): number => {
  a = normalize(a);
  b = normalize(b);
  if (!a || !b) return 0; if (a===b) return 1;
  const grams = (str: string) => { const m = new Map(); for (let i = 0; i < str.length - 1; i++) { const g = str.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A=grams(a), B=grams(b);
  let inter=0, total=0; for (const [g,c] of A){ if (B.has(g)) inter+=Math.min(c,B.get(g)); total+=c; } for (const [,c] of B) total+=c; return (2*inter)/(total||1);
};

export const classSafeString = (str: string) => str.replace(/[^a-zA-Z0-9-_]+/g, '-');

const nop = (...args: any[]) => {};
export const logger = IS_DEBUG ? console : {log: nop,group:nop,groupCollapsed:nop,groupEnd:nop,info:nop,debug:nop,error:nop,warn:nop,table:nop};
export const debug = IS_DEBUG ? console.debug.bind(console) : nop;
export const debugTable = IS_DEBUG ? console.table.bind(console) : nop;

export const isNodeEl = (x: any): x is Element =>
  x && typeof x === 'object' && x.nodeType === 1 && typeof (x as any).tagName === 'string';

export const isHtmlInput = (x: any): x is HTMLInputElement =>
  isNodeEl(x) && (x as Element).tagName.toUpperCase() === 'INPUT';

export const isPlainObject = (x: any): x is Record<string, unknown> =>
  Object.prototype.toString.call(x) === '[object Object]';
