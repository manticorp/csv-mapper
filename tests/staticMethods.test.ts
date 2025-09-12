/**
 * CsvMapper static methods tests
 */

import CsvMapper from '../src/csvMapper';

describe('CsvMapper Static Methods', () => {
  describe('parseCSV', () => {
    test('should parse simple CSV', () => {
      const csvText = 'name,email,age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25';

      const result = CsvMapper.parseCSV(csvText);

      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: '30'
      });
      expect(result.dialect.separator).toBe(',');
    });

    test('should parse CSV with quoted fields', () => {
      const csvText = 'name,description\n"John Doe","A person who likes, commas"\n"Jane Smith","Another person"';

      const result = CsvMapper.parseCSV(csvText);

      expect(result.rows[0].description).toBe('A person who likes, commas');
    });

    test('should parse CSV with line breaks in fields', () => {
      const csvText = 'name,description\n"John","Line 1\nLine 2"\n"Jane","Single line"';

      const result = CsvMapper.parseCSV(csvText);

      expect(result.rows[0].description).toBe('Line 1\nLine 2');
    });

    test('should parse semicolon-separated CSV', () => {
      const csvText = 'name;email;age\nJohn Doe;john@example.com;30';

      const result = CsvMapper.parseCSV(csvText, { delimiter: ';' });

      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows[0].email).toBe('john@example.com');
    });

    test('should handle empty CSV', () => {
      const result = CsvMapper.parseCSV('');

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    test('should handle CSV with only headers', () => {
      const result = CsvMapper.parseCSV('name,email,age');

      expect(result.headers).toEqual(['name', 'email', 'age']);
      expect(result.rows).toEqual([]);
    });
  });

  describe('detectDialect', () => {
    test('should detect comma delimiter', () => {
      const csvText = 'name,email,age\nJohn,john@example.com,30';

      const dialect = CsvMapper.detectDialect(csvText);

      expect(dialect.separator).toBe(',');
      expect(dialect.enclosure).toBe('"');
    });

    test('should detect semicolon delimiter', () => {
      const csvText = 'name;email;age\nJohn;john@example.com;30';

      const dialect = CsvMapper.detectDialect(csvText);

      expect(dialect.separator).toBe(';');
    });

    test('should detect tab delimiter', () => {
      const csvText = 'name\temail\tage\nJohn\tjohn@example.com\t30';

      const dialect = CsvMapper.detectDialect(csvText);

      expect(dialect.separator).toBe('\t');
    });

    test('should handle empty text', () => {
      const dialect = CsvMapper.detectDialect('');

      expect(dialect).toHaveProperty('separator');
      expect(dialect).toHaveProperty('enclosure');
      expect(dialect).toHaveProperty('escape');
    });
  });

  describe('Static Properties', () => {
    test('should have DefaultUIRenderer as static property', () => {
      expect(CsvMapper.DefaultUIRenderer).toBeDefined();
      expect(typeof CsvMapper.DefaultUIRenderer).toBe('function');
    });
  });
});
