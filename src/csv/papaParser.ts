/*
 * CSV Parser using PapaParse – Robust CSV parsing with excellent dialect detection
 * -------------------------------------------------------------------------------
 * This implementation uses the popular PapaParse library which handles edge cases
 * like multiline fields much better than custom parsing.
 *
 * Provides instance methods for parsing, dialect detection, and CSV generation.
 */

import Papa from 'papaparse';
import { CsvDialect, ParseOptions, ParseResult, DetectDialectOptions, CsvParser } from '../types.js';
import { debug } from '../helpers.js';

export class PapaParser implements CsvParser {
  /**
   * Parse CSV text with auto-detection or explicit dialect options
   * @param text CSV text to parse
   * @param options Parsing options including dialect preferences
   * @returns Parsed result with headers, rows, and detected dialect
   */
  parseCSV(text: string, { headers = true, separator = '', enclosure = '', escape = '', guessMaxLines = 25 }: ParseOptions = {}): ParseResult {
    const config: Papa.ParseConfig = {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false
    };

    if (separator) config.delimiter = separator;
    if (enclosure) config.quoteChar = enclosure;
    if (escape) config.escapeChar = escape;

    const result = Papa.parse(text, config);

    if (result.errors.length > 0) {
      console.warn('PapaParse errors:', result.errors);
    }

    const rows = result.data as string[][];

    while (rows.length > 0 && rows[rows.length - 1].every((cell: string) => cell === '')) {
        rows.pop();
    }

    if (rows.length === 0) {
      return {
        headers: [],
        rows: [],
        rawRows: [],
        dialect: { separator: separator || ',', enclosure: enclosure || '"', escape: escape || null }
      };
    }

    const dialect: CsvDialect = {
      separator: result.meta.delimiter || separator || ',',
      enclosure: enclosure || '"',
      escape: escape || null
    };

    if (headers) {
      const headerRow = rows.shift() || [];
      const dataRows = rows.map((arr: string[]) =>
        Object.fromEntries(headerRow.map((h, idx) => [h, arr[idx] ?? '']))
      );
      return { headers: headerRow, rows: dataRows, rawRows: rows, dialect };
    }

    const maxLen = rows.reduce((m, a) => Math.max(m, a.length), 0);
    const generatedHeaders = Array.from({ length: maxLen }, (_, i) => `Column ${i + 1}`);
    const dataRows = rows.map((arr: string[]) =>
      Object.fromEntries(generatedHeaders.map((h, idx) => [h, arr[idx] ?? '']))
    );
    return { headers: generatedHeaders, rows: dataRows, rawRows: rows, dialect };
  }

  /**
   * Detect CSV dialect (separator, enclosure, escape) from sample text
   * @param text CSV text to analyze
   * @param options Dialect detection options
   * @returns Detected CSV dialect
   */
  detectDialect(text: string, { separator = null, enclosure = null, escape = null, guessMaxLines = 25 }: DetectDialectOptions = {}): CsvDialect {
    let sampleText = text;
    if (guessMaxLines > 0) {
      const lines = text.split(/\r\n|\n|\r/);
      sampleText = lines.slice(0, guessMaxLines).join('\n');
    }

    const config: Papa.ParseConfig = {
      header: false,
      preview: 5,
      skipEmptyLines: true
    };

    if (separator) config.delimiter = separator;
    if (enclosure) config.quoteChar = enclosure;
    if (escape) config.escapeChar = escape;

    const result = Papa.parse(sampleText, config);

    return {
      separator: result.meta.delimiter || separator || ',',
      enclosure: enclosure || '"',
      escape: escape || null
    };
  }

  /**
   * Convert array of values to CSV row string
   * @param arr Array of values to convert
   * @param sep Field separator (default: comma)
   * @param quote Enclosure character (default: double quote)
   * @param esc Escape character (null for quote doubling)
   * @returns CSV row string
   */
  toCsvRow(arr: any[], sep: string = ',', quote: string = '"', esc: string | null = null): string {
    const config: Papa.UnparseConfig = {
      delimiter: sep,
      quoteChar: quote,
      header: false
    };
    if (esc) config.escapeChar = esc;
    return Papa.unparse([arr.map((v: any) => String(v ?? ''))], config);
  }

  /**
   * Parse CSV text with a specific dialect
   * @param text CSV text to parse
   * @param sep Field separator character
   * @param quote Enclosure/quote character
   * @param esc Escape character (null for quote doubling)
   * @returns Array of string arrays (raw CSV rows)
   */
  _parseWithDialect(text: string, sep: string, quote: string, esc: string | null): string[][] {
    const config: Papa.ParseConfig = {
      header: false,
      delimiter: sep,
      quoteChar: quote,
      skipEmptyLines: true,
      dynamicTyping: false
    };

    if (esc) {
      config.escapeChar = esc;
    }

    const result = Papa.parse(text, config);
    return result.data as string[][];
  }

  /**
   * Get a sample of text containing up to maxRows logical CSV rows
   * For PapaParse, we can just use a simple line-based approach since
   * PapaParse handles the complex parsing internally
   */
  _getSampleText(text: string, maxRows: number): string {
    if (maxRows <= 0) return text;

    const lines = text.split(/\r\n|\n|\r/);
    return lines.slice(0, maxRows).join('\n');
  }

  // Keep these helper methods for API compatibility
  _mode(arr: number[]): number | null {
    const m = new Map();
    let best = null, bestC = -1;
    for (const v of arr) {
      const c = (m.get(v) || 0) + 1;
      m.set(v, c);
      if (c > bestC) {
        best = v;
        bestC = c;
      }
    }
    return best;
  }

  _escRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, (r: string) => `\\${r}`);
  }
}
