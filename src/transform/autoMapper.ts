import { normalize } from "../helpers";
import { ColumnSpec, CsvMapping, MappingMode } from "../types";

export class AutoMapper {
    static map(
        headers: string[],
        columns: ColumnSpec[],
        mode: MappingMode = 'csvToConfig',
        autoThreshold = 0.8,
        existingMapping: CsvMapping = {}
    ) {
        const mappingMode = mode || 'csvToConfig';
        const used = new Map();

        if (mappingMode === 'csvToConfig') {
            for (const src of headers) {
                let best = ''; let score = 0;
                for (const spec of columns) {
                    const count = used.get(spec.name)||0;
                    const canUse = spec.allowDuplicates === true || count === 0;
                    if (!canUse) continue;
                    const s = AutoMapper.matchScore(src, spec);
                    if (s > score) {
                        score = s;
                        best = spec.name;
                    }
                }
                if (score >= autoThreshold!) {
                    AutoMapper.addMapping(existingMapping, src, best);
                    used.set(best, (used.get(best)||0)+1);
                }
            }
        } else {
            // Reverse mode: Config columns -> CSV headers
            for (const spec of columns) {
                let best = ''; let score = 0;
                for (const header of headers) {
                    const count = used.get(header)||0;
                    const canUse = count === 0; // Each CSV header can only be used once
                    if (!canUse) continue;
                    const s = AutoMapper.matchScore(header, spec);
                    if (s > score) {
                        score = s;
                        best = header;
                    }
                }
                if (score >= autoThreshold!) {
                    AutoMapper.addMapping(existingMapping, best, spec.name); // Still CSV header -> config column
                    used.set(best, (used.get(best)||0)+1);
                }
            }
        }
        return existingMapping;
    }

    static matchScore(srcHeader: string, spec: ColumnSpec): number {
        const norm = normalize(srcHeader);
        const title = normalize(spec.title||'');
        const name  = normalize(spec.name||'');
        let score = 0;
        if (spec.match instanceof RegExp) {
          if (spec.match.test(srcHeader) || spec.match.test(norm)) score = Math.max(score, 1.0);
        } else if (typeof spec.match === 'function') {
          try { if (spec.match(srcHeader) || spec.match(norm)) score = Math.max(score, 1.0); } catch(e){}
        }
        if (norm === name || norm === title) score = Math.max(score, 0.98);
        if (norm.includes(name) || norm.includes(title)) score = Math.max(score, 0.9);
        score = Math.max(score, AutoMapper.similarity(norm, name) * 0.85);
        score = Math.max(score, AutoMapper.similarity(norm, title) * 0.85);
        return score;
    }

    static similarity(a: string, b: string): number {
        a = normalize(a);
        b = normalize(b);
        if (!a || !b) return 0;
        if (a===b) return 1;
        const grams = (str: string) => {
            const m = new Map();
            for (let i = 0; i < str.length - 1; i++) {
                const g = str.slice(i, i + 2);
                m.set(g, (m.get(g) || 0) + 1);
            }
            return m;
        };
        const A=grams(a), B=grams(b);
        let inter=0, total=0;
        for (const [g,c] of A){
            if (B.has(g))inter+=Math.min(c,B.get(g));
            total+=c;
        }
        for (const [,c] of B) total+=c;
        return (2*inter)/(total||1);
    }

    static addMapping(mapping: CsvMapping, csvHeader: string, configColumn: string): void {
        const current = mapping[csvHeader];
        if (!current) {
            mapping[csvHeader] = configColumn;
        } else if (typeof current === 'string') {
            // Convert single value to array if adding another
            if (current !== configColumn) {
                mapping[csvHeader] = [current, configColumn];
            }
        } else {
            // Already an array, add if not present
            if (!current.includes(configColumn)) {
                current.push(configColumn);
            }
        }
    }
}