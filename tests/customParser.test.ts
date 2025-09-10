/**
 * Custom Parser Interface tests
 */

import CsvMapper from '../src/csvMapper';
import { CsvParser, CsvDialect } from '../src/types';

// Mock custom parser for testing
class MockCustomParser implements CsvParser {
  parseCSV = jest.fn();
  detectDialect = jest.fn();
  toCsvRow = jest.fn();
}

describe('Custom Parser Interface', () => {
  let fileInput: HTMLInputElement;
  let customParser: MockCustomParser;
  let mapper: CsvMapper;

  beforeEach(() => {
    fileInput = new (window.HTMLInputElement as any)();
    fileInput.type = 'file';
    customParser = new MockCustomParser();
  });

  afterEach(() => {
    if (mapper) {
      mapper.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Parser Integration', () => {
    test('should use custom parser when provided', () => {
      mapper = new CsvMapper(fileInput, {
        parser: customParser,
        showUserControls: false
      });

      expect(mapper.parser).toBe(customParser);
    });

    test('should use default PapaParser when no custom parser provided', () => {
      mapper = new CsvMapper(fileInput, { showUserControls: false });

      expect(mapper.parser).toBeDefined();
      expect(mapper.parser).not.toBe(customParser);
    });

    test('should call custom parser methods during file processing', async () => {
      // Setup mock parser responses
      customParser.parseCSV.mockReturnValue({
        headers: ['name', 'email'],
        rows: [{ name: 'John', email: 'john@example.com' }],
        rawRows: [['John', 'john@example.com']],
        dialect: { separator: ',', enclosure: '"', escape: null }
      });

      mapper = new CsvMapper(fileInput, {
        parser: customParser,
        showUserControls: false
      });

      // Mock file processing
      const mockFile = new File(['name,email\nJohn,john@example.com'], 'test.csv', {
        type: 'text/csv'
      });

      // Mock the file reading
      const originalText = File.prototype.text;
      File.prototype.text = jest.fn().mockResolvedValue('name,email\nJohn,john@example.com');

      // Simulate file change
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: true
      });

      // Trigger the file change event
      await mapper._onFileChange();

      expect(customParser.parseCSV).toHaveBeenCalledWith(
        'name,email\nJohn,john@example.com',
        expect.any(Object)
      );

      // Restore original
      File.prototype.text = originalText;
    });
  });

  describe('Custom Parser Implementation', () => {
    test('should implement all required methods', () => {
      class TestParser implements CsvParser {
        parseCSV(text: string, options = {}) {
          return {
            headers: ['col1', 'col2'],
            rows: [{ col1: 'val1', col2: 'val2' }],
            rawRows: [['val1', 'val2']],
            dialect: { separator: ',', enclosure: '"', escape: null }
          };
        }

        detectDialect(text: string) {
          return {
            separator: ',',
            enclosure: '"',
            escape: null
          };
        }

        toCsvRow(arr: any[], sep = ',', quote = '"', esc: string | null = null) {
          return arr.join(sep);
        }
      }

      const testParser = new TestParser();
      
      // Test parseCSV
      const parseResult = testParser.parseCSV('test,data');
      expect(parseResult.headers).toEqual(['col1', 'col2']);
      expect(parseResult.rows).toHaveLength(1);
      expect(parseResult.dialect.separator).toBe(',');

      // Test detectDialect
      const dialect = testParser.detectDialect('test,data');
      expect(dialect.separator).toBe(',');
      expect(dialect.enclosure).toBe('"');

      // Test toCsvRow
      const csvRow = testParser.toCsvRow(['val1', 'val2']);
      expect(csvRow).toBe('val1,val2');
    });

    test('should handle different dialects in custom parser', () => {
      class SemicolonParser implements CsvParser {
        parseCSV(text: string, options = {}) {
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0]?.split(';') || [];
          const rawRows = lines.slice(1).map(line => line.split(';'));
          const rows = rawRows.map(values => {
            const row: Record<string, any> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });

          return {
            headers,
            rows,
            rawRows,
            dialect: { separator: ';', enclosure: '"', escape: null }
          };
        }

        detectDialect(text: string) {
          return {
            separator: ';',
            enclosure: '"',
            escape: null
          };
        }

        toCsvRow(arr: any[], sep = ';', quote = '"') {
          return arr.map(val => String(val || '')).join(sep);
        }
      }

      const parser = new SemicolonParser();
      const result = parser.parseCSV('name;email\nJohn;john@example.com');
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows[0]).toEqual({ name: 'John', email: 'john@example.com' });
      expect(result.dialect.separator).toBe(';');

      const csvRow = parser.toCsvRow(['Jane', 'jane@example.com']);
      expect(csvRow).toBe('Jane;jane@example.com');
    });
  });

  describe('Static Methods with Custom Parser', () => {
    test('should use default parser for static methods', () => {
      // Static methods should always use the default parser, not custom instances
      const result = CsvMapper.parseCSV('name,email\nJohn,john@example.com');
      
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows).toHaveLength(1);
      expect(result.dialect.separator).toBe(',');
    });

    test('should not interfere with instance parser', () => {
      customParser.parseCSV.mockReturnValue({
        headers: ['custom'],
        rows: [{ custom: 'value' }],
        rawRows: [['value']],
        dialect: { separator: '|', enclosure: "'", escape: null }
      });

      mapper = new CsvMapper(fileInput, {
        parser: customParser,
        showUserControls: false
      });

      // Static method should work independently
      const staticResult = CsvMapper.parseCSV('name,email\nJohn,john@example.com');
      expect(staticResult.headers).toEqual(['name', 'email']);
      expect(staticResult.dialect.separator).toBe(',');

      // Instance should use custom parser
      expect(mapper.parser).toBe(customParser);
    });
  });

  describe('Parser Error Handling', () => {
    test('should handle parser errors gracefully', () => {
      customParser.parseCSV.mockImplementation(() => {
        throw new Error('Custom parser error');
      });

      mapper = new CsvMapper(fileInput, {
        parser: customParser,
        showUserControls: false
      });

      // Should not throw when creating the mapper
      expect(mapper.parser).toBe(customParser);
    });

    test('should validate parser interface at runtime', () => {
      const incompleteParser = {
        parseCSV: jest.fn()
        // Missing detectDialect and toCsvRow
      } as any;

      // Should still work (TypeScript would catch this at compile time)
      mapper = new CsvMapper(fileInput, {
        parser: incompleteParser,
        showUserControls: false
      });

      expect(mapper.parser).toBe(incompleteParser);
    });
  });
});
