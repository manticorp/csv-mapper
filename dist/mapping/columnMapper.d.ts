import { ColumnSpec } from '../types.js';
export interface ColumnMappingOptions {
    /** Minimum score threshold for auto-mapping (0-1) */
    autoThreshold?: number;
    /** Whether to allow multiple source columns to map to the same target */
    allowDuplicates?: boolean;
}
export interface MappingResult {
    /** Source header to target column name mapping */
    mapping: Record<string, string>;
    /** Mapping scores for debugging/inspection */
    scores: Record<string, {
        target: string;
        score: number;
    }[]>;
}
export declare class ColumnMapper {
    private options;
    constructor(options?: ColumnMappingOptions);
    /**
     * Automatically map source headers to target column specifications
     * @param sourceHeaders Array of CSV header names from the source file
     * @param targetColumns Array of column specifications to map to
     * @returns Mapping result with source-to-target mapping and scores
     */
    autoMap(sourceHeaders: string[], targetColumns: ColumnSpec[]): MappingResult;
    /**
     * Calculate similarity score between a source header and target column spec
     * @param sourceHeader Source CSV header name
     * @param targetSpec Target column specification
     * @returns Similarity score between 0 and 1
     */
    calculateMatchScore(sourceHeader: string, targetSpec: ColumnSpec): number;
    /**
     * Validate that all required columns are mapped
     * @param mapping Current source-to-target mapping
     * @param targetColumns Array of column specifications
     * @returns Array of missing required column names
     */
    validateRequiredColumns(mapping: Record<string, string>, targetColumns: ColumnSpec[]): string[];
    /**
     * Get mapping suggestions for a specific source header
     * @param sourceHeader Source header to get suggestions for
     * @param targetColumns Available target columns
     * @param maxSuggestions Maximum number of suggestions to return
     * @returns Array of suggestions sorted by score (highest first)
     */
    getSuggestions(sourceHeader: string, targetColumns: ColumnSpec[], maxSuggestions?: number): {
        target: string;
        score: number;
        spec: ColumnSpec;
    }[];
    /**
     * Check for potential mapping conflicts (multiple sources mapping to same target)
     * @param mapping Current mapping
     * @param targetColumns Target column specifications
     * @returns Array of conflict descriptions
     */
    detectConflicts(mapping: Record<string, string>, targetColumns: ColumnSpec[]): string[];
    /**
     * Normalize a string for comparison (lowercase, remove punctuation, trim whitespace)
     * @param s String to normalize
     * @returns Normalized string
     */
    static normalize(s: any): string;
    /**
     * Calculate similarity between two strings using bigram analysis
     * @param a First string
     * @param b Second string
     * @returns Similarity score between 0 and 1
     */
    static similarity(a: string, b: string): number;
}
//# sourceMappingURL=columnMapper.d.ts.map