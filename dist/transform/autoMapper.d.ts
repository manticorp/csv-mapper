import { ColumnSpec, CsvMapping, MappingMode } from "../types";
export declare class AutoMapper {
    static map(headers: string[], columns: ColumnSpec[], mode?: MappingMode, autoThreshold?: number, existingMapping?: CsvMapping): CsvMapping;
    static matchScore(srcHeader: string, spec: ColumnSpec): number;
    static similarity(a: string, b: string): number;
    static addMapping(mapping: CsvMapping, csvHeader: string, configColumn: string): void;
}
//# sourceMappingURL=autoMapper.d.ts.map