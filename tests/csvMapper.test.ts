/**
 * Core CsvMapper functionality tests
 */

import CsvMapper from '../src/csvMapper';
import { CsvParser, ColumnSpec } from '../src/types';

// Mock file input element
const createMockFileInput = () => {
  const input = new (window.HTMLInputElement as any)();
  input.type = 'file';
  return input;
};

describe('CsvMapper Core', () => {
  let fileInput: HTMLInputElement;
  let mapper: CsvMapper;

  beforeEach(() => {
    fileInput = createMockFileInput();
  });

  afterEach(() => {
    if (mapper) {
      mapper.destroy();
    }
  });

  describe('Constructor', () => {
    test('should create CsvMapper instance with file input', () => {
      mapper = new CsvMapper(fileInput);

      expect(mapper).toBeInstanceOf(CsvMapper);
      expect(mapper.input).toBe(fileInput);
      expect(mapper.columns).toEqual([]);
      expect(mapper.headers).toEqual([]);
      expect(mapper.csv).toBeNull();
    });

    test('should create CsvMapper with options', () => {
      const columns: ColumnSpec[] = [
        { name: 'name', title: 'Full Name', required: true },
        { name: 'email', title: 'Email Address' }
      ];

      mapper = new CsvMapper(fileInput, {
        columns,
        showUserControls: false,
        remap: false
      });

      expect(mapper.columns).toHaveLength(2);
      expect(mapper.columns[0].name).toBe('name');
      expect(mapper.columns[0].required).toBe(true);
      expect(mapper.opts.showUserControls).toBe(false);
      expect(mapper.opts.remap).toBe(false);
    });

    test('should accept custom parser', () => {
      const customParser: CsvParser = {
        parseCSV: jest.fn(),
        detectDialect: jest.fn(),
        toCsvRow: jest.fn()
      };

      mapper = new CsvMapper(fileInput, {
        parser: customParser
      });

      expect(mapper.getParser()).toBe(customParser);
    });

    test('should throw error for non-file input', () => {
      const badInput = true as any;

      expect(() => {
        new CsvMapper(badInput);
      }).toThrow('CsvMapper: first argument must be a file input, selector or options object.');
    });

    test('should accept string selector', () => {
      const mockInput = createMockFileInput();
      (document.querySelector as jest.Mock).mockReturnValueOnce(mockInput);

      mapper = new CsvMapper('#test-input');
      expect(mapper.input).toBe(mockInput);
    });
  });

  describe('Column Management', () => {
    beforeEach(() => {
      mapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'name', title: 'Full Name' },
          { name: 'email' }, // Should get auto title
          { name: 'age', required: true, validate: { type: 'number', min: 0 } }
        ]
      });
    });

    test('should auto-generate titles for columns', () => {
      expect(mapper.columns[0].title).toBe('Full Name');
      expect(mapper.columns[1].title).toBe('email'); // Auto-generated
      expect(mapper.columns[2].title).toBe('age');
    });

    test('should handle string column specs', () => {
      const simpleMapper = new CsvMapper(fileInput, {
        columns: ['name', 'email', 'age']
      });

      expect(simpleMapper.columns).toHaveLength(3);
      expect(simpleMapper.columns[0]).toEqual({ name: 'name', title: 'name' });
      expect(simpleMapper.columns[1]).toEqual({ name: 'email', title: 'email' });

      simpleMapper.destroy();
    });
  });

  describe('Mapping Management', () => {
    beforeEach(() => {
      mapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'name', required: true },
          { name: 'email', required: true },
          { name: 'age' }
        ],
        showUserControls: false
      });
    });

    test('should get and set mapping', () => {
      const mapping = { 'Full Name': 'name', 'Email Address': 'email' };

      mapper.setMapping(mapping);
      expect(mapper.getMapping()).toEqual(mapping);
    });

    test('should validate required columns', () => {
      // No mapping set - should be invalid
      const validation1 = mapper.validateRequiredColumns();
      expect(validation1.isValid).toBe(false);
      expect(validation1.missingRequired).toEqual(['name', 'email']);

      // Partial mapping - still invalid
      mapper.setMapping({ 'Name': 'name' });
      const validation2 = mapper.validateRequiredColumns();
      expect(validation2.isValid).toBe(false);
      expect(validation2.missingRequired).toEqual(['email']);

      // Complete mapping - valid
      mapper.setMapping({ 'Name': 'name', 'Email': 'email' });
      const validation3 = mapper.validateRequiredColumns();
      expect(validation3.isValid).toBe(true);
      expect(validation3.missingRequired).toEqual([]);
    });
  });

  describe('Events', () => {
    test('should be an EventTarget', () => {
      mapper = new CsvMapper(fileInput);
      expect(mapper).toBeInstanceOf(EventTarget);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup event listeners on destroy', () => {
      mapper = new CsvMapper(fileInput);
      const removeEventListenerSpy = jest.spyOn(fileInput, 'removeEventListener');

      mapper.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    test('should remove auto-created containers on destroy', () => {
      mapper = new CsvMapper(fileInput, { showUserControls: true });

      const mockContainer = {
        dataset: { csvMapperAutocreated: '1' },
        remove: jest.fn()
      };
      mapper.controlsEl = mockContainer as any;

      mapper.destroy();

      expect(mockContainer.remove).toHaveBeenCalled();
    });
  });
});
