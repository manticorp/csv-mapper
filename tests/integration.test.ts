/**
 * Integration tests for CsvMapper
 * Tests the full workflow from file upload to data mapping
 */
import CsvMapper from '../src/csvMapper';
import { CsvParser, ColumnSpec } from '../src/types';
import { Csv } from '../src/csv/csv';

describe('CsvMapper Integration Tests', () => {
  let fileInput: HTMLInputElement;
  let csvMapper: CsvMapper;

  beforeEach(() => {
    // Create a proper mock file input element
    const mockInput = {
      type: 'file',
      accept: '.csv',
      files: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      insertAdjacentElement: jest.fn(),
      style: {},
      parentNode: null,
      dispatchEvent: jest.fn(),
      value: '',
      dataset: {}
    };

    // Make it pass instanceof HTMLInputElement check
    Object.setPrototypeOf(mockInput, HTMLInputElement.prototype);
    fileInput = mockInput as unknown as HTMLInputElement;
  });  afterEach(() => {
    if (csvMapper) {
      csvMapper.destroy();
    }
  });

  describe('End-to-End CSV Processing', () => {
    test('should initialize with columns and validate mapping', () => {
      const columns: ColumnSpec[] = [
        { name: 'fullName', title: 'Full Name', required: true },
        { name: 'age', title: 'Age' },
        { name: 'city', title: 'City' }
      ];

      csvMapper = new CsvMapper(fileInput, { columns });

      expect(csvMapper.columns).toEqual(columns);
      expect(csvMapper.input).toBe(fileInput);

      // Test mapping validation
      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(false); // No headers yet
      expect(validation.missingRequired).toContain('fullName');
    });

    test('should process CSV data and validate mapping', () => {
      const columns: ColumnSpec[] = [
        { name: 'name', title: 'Full Name', required: true },
        { name: 'age', title: 'Age', required: true },
        { name: 'email', title: 'Email' }
      ];

      csvMapper = new CsvMapper(fileInput, { columns, remap: true, showUserControls: false });

      // Simulate CSV headers being loaded
      csvMapper.headers = ['Name', 'Age', 'City', 'Email'];
      csvMapper.csv = new Csv([
        ['John Doe', '30', 'New York', 'john@example.com'],
        ['Jane Smith', '25', 'Los Angeles', 'jane@example.com']
      ], ['Name', 'Age', 'City', 'Email']);

      // Set up mapping
      csvMapper.setMapping({
        'Name': 'name',
        'Age': 'age',
        'Email': 'email'
      });

      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(true);
      expect(validation.missingRequired).toHaveLength(0);

      // Test mapped data retrieval
      expect(csvMapper.headers).toContain('Name');
      expect(csvMapper.headers).toContain('Age');
      expect(csvMapper.csv?.length).toBe(2);
    });

    test('should handle complex column specifications', () => {
      const columns: ColumnSpec[] = [
        {
          name: 'email',
          title: 'Email Address',
          required: true,
          validate: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        {
          name: 'age',
          title: 'Age',
          validate: (value: any) => !isNaN(Number(value)) && Number(value) > 0
        },
        {
          name: 'fullName',
          title: 'Full Name',
          transform: (value: any, row: Record<string, any>) => {
            return value ? value.toUpperCase() : value;
          }
        }
      ];

      csvMapper = new CsvMapper(fileInput, { columns });

      expect(csvMapper.columns).toHaveLength(3);
      expect(csvMapper.columns[0].validate).toBeInstanceOf(RegExp);
      expect(typeof csvMapper.columns[1].validate).toBe('function');
      expect(typeof csvMapper.columns[2].transform).toBe('function');
    });

    test('should work with custom parser', () => {
      // Create a simple custom parser
      const customParser: CsvParser = {
        parseCSV: (text: string) => {
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',');
          const rows = lines.slice(1).map(line => {
            const values = line.split(',');
            const row: any = {};
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim() || '';
            });
            return row;
          });
          return {
            headers,
            rows,
            rawRows: rows.map(r => Object.values(r)),
            dialect: { separator: ',', enclosure: '"', escape: null }
          };
        },
        detectDialect: (text: string) => ({ separator: ',', enclosure: '"', escape: null }),
        toCsvRow: (arr: any[]) => arr.join(',')
      };

      csvMapper = new CsvMapper(fileInput, { parser: customParser });

      expect(csvMapper.opts.parser).toBe(customParser);
    });

    test('should handle validation errors gracefully', () => {
      const columns: ColumnSpec[] = [
        { name: 'name', title: 'Name', required: true },
        { name: 'age', title: 'Age', required: true },
        { name: 'email', title: 'Email', required: true }
      ];

      csvMapper = new CsvMapper(fileInput, { columns, showUserControls: false });

      // Simulate partial mapping
      csvMapper.headers = ['Name', 'City'];  // Missing Age and Email headers
      csvMapper.setMapping({
        'Name': 'name'
        // Age and Email not mapped
      });

      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('age');
      expect(validation.missingRequired).toContain('email');
    });

    test('should handle remapping option', () => {
      csvMapper = new CsvMapper(fileInput, { remap: true });

      expect(csvMapper.opts.remap).toBe(true);

      // Test with remap disabled
      const csvMapper2 = new CsvMapper(fileInput, { remap: false });
      expect(csvMapper2.opts.remap).toBe(false);

      csvMapper2.destroy();
    });

    test('should handle user controls option', () => {
      csvMapper = new CsvMapper(fileInput, {
        showUserControls: true,
        controlsContainer: document.createElement('div')
      });

      expect(csvMapper.opts.showUserControls).toBe(true);
      expect(csvMapper.controlsEl).toBeDefined();
    });

    test('should handle mapping input element', () => {
      const mappingInput = document.createElement('input');

      csvMapper = new CsvMapper(fileInput, { mappingInput });

      expect(csvMapper.opts.mappingInput).toBe(mappingInput);
    });
  });

  describe('Static Methods Integration', () => {
    test('should use static parseCSV method', () => {
      const csvText = 'Name,Age\nJohn,30\nJane,25';

      const result = CsvMapper.parseCSV(csvText);

      expect(result.headers).toEqual(['Name', 'Age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '30' });
    });

    test('should use static detectDialect method', () => {
      const csvText = 'Name;Age\n"John Doe";30\n"Jane Smith";25';

      const dialect = CsvMapper.detectDialect(csvText);

      expect(dialect.separator).toBe(';');
      expect(dialect.enclosure).toBe('"');
    });

    test('should use static toCsvRow method', () => {
      const row = ['John Doe', '30', 'New York'];

      const csvRow = CsvMapper.toCsvRow(row);

      expect(csvRow).toBe('John Doe,30,New York');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid input element', () => {
      // Create a mock HTMLInputElement that's not a file input
      const invalidInput = new (window.HTMLInputElement as any)();
      invalidInput.type = 'text'; // Make it not a file input

      expect(() => {
        new CsvMapper(invalidInput);
      }).toThrow('CsvMapper: first argument must be a file input, selector or options object.');
    });

    test('should handle missing required columns gracefully', () => {
      const columns: ColumnSpec[] = [
        { name: 'name', title: 'Name', required: true },
        { name: 'email', title: 'Email', required: true }
      ];

      csvMapper = new CsvMapper(fileInput, { columns });

      // No headers set yet
      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toEqual(['name', 'email']);
    });
  });

  describe('Custom UI Renderer', () => {
    test('should accept custom UI renderer', () => {
      const mockRenderer = {
        render: jest.fn(),
        onMappingChange: jest.fn(),
        updateValidation: jest.fn(),
        updateMapping: jest.fn(),
        destroy: jest.fn()
      };

      csvMapper = new CsvMapper(fileInput, { uiRenderer: mockRenderer });

      expect(csvMapper.opts.uiRenderer).toBe(mockRenderer);
    });
  });

  describe('Mapping Modes', () => {
    test('should default to configToCsv mapping mode', () => {
      csvMapper = new CsvMapper(fileInput);
      expect(csvMapper.opts.mappingMode).toBe('configToCsv');
    });

    test('should accept configToCsv mapping mode', () => {
      csvMapper = new CsvMapper(fileInput, { mappingMode: 'csvToConfig' });
      expect(csvMapper.opts.mappingMode).toBe('csvToConfig');
    });

    test('should handle reverse mapping in configToCsv mode', () => {
      const columns = [
        { name: 'id', title: 'ID', required: true },
        { name: 'name', title: 'Full Name' }
      ];

      csvMapper = new CsvMapper(fileInput, {
        columns,
        mappingMode: 'configToCsv',
        showUserControls: false  // Disable UI rendering for this test
      });

      // Simulate CSV headers
      csvMapper.headers = ['user_id', 'full_name', 'email'];

      // The mapping is always csvHeader -> configColumn, regardless of UI mode
      csvMapper.addColumnMapping('user_id', 'id');
      csvMapper.addColumnMapping('full_name', 'name');

      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(true);
      expect(validation.mappedTargets).toContain('id');
    });

    test('should support many-to-many mappings', () => {
      const columns = [
        { name: 'product_id', title: 'Product ID', required: true },
        { name: 'sku', title: 'SKU Code', required: true },
        { name: 'unique_identifier', title: 'Unique ID' },
        { name: 'display_name', title: 'Display Name' },
        { name: 'sort_name', title: 'Sort Name' }
      ];

      csvMapper = new CsvMapper(fileInput, {
        columns,
        showUserControls: false
      });

      // Simulate CSV headers
      csvMapper.headers = ['product_sku', 'full_name', 'price'];

      // Add multiple mappings for the same CSV column
      csvMapper.addColumnMapping('product_sku', 'product_id');
      csvMapper.addColumnMapping('product_sku', 'sku');
      csvMapper.addColumnMapping('product_sku', 'unique_identifier');

      csvMapper.addColumnMapping('full_name', 'display_name');
      csvMapper.addColumnMapping('full_name', 'sort_name');

      // Verify the mappings
      const skuMappings = csvMapper.getColumnMappings('product_sku');
      expect(skuMappings).toEqual(['product_id', 'sku', 'unique_identifier']);

      const nameMappings = csvMapper.getColumnMappings('full_name');
      expect(nameMappings).toEqual(['display_name', 'sort_name']);

      // Verify all mappings
      const allMappings = csvMapper.getAllMappings();
      expect(allMappings['product_sku']).toEqual(['product_id', 'sku', 'unique_identifier']);
      expect(allMappings['full_name']).toEqual(['display_name', 'sort_name']);
      expect(allMappings['price']).toEqual([]);

      // Verify validation passes
      const validation = csvMapper.validateRequiredColumns();
      expect(validation.isValid).toBe(true);
      expect(validation.mappedTargets).toContain('product_id');
      expect(validation.mappedTargets).toContain('sku');
    });

    test('should support removing individual mappings', () => {
      csvMapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'id', title: 'ID' },
          { name: 'name', title: 'Name' },
          { name: 'sku', title: 'SKU' }
        ],
        showUserControls: false
      });

      csvMapper.headers = ['product_code'];

      // Add multiple mappings
      csvMapper.addColumnMapping('product_code', 'id');
      csvMapper.addColumnMapping('product_code', 'name');
      csvMapper.addColumnMapping('product_code', 'sku');

      expect(csvMapper.getColumnMappings('product_code')).toEqual(['id', 'name', 'sku']);

      // Remove one mapping
      csvMapper.removeColumnMapping('product_code', 'name');
      expect(csvMapper.getColumnMappings('product_code')).toEqual(['id', 'sku']);

      // Remove another mapping
      csvMapper.removeColumnMapping('product_code', 'id');
      expect(csvMapper.getColumnMappings('product_code')).toEqual(['sku']);

      // Remove last mapping
      csvMapper.removeColumnMapping('product_code', 'sku');
      expect(csvMapper.getColumnMappings('product_code')).toEqual([]);
    });
  });

  describe('Csv Output - simple case', () => {
    test('should cleanup event listeners on destroy', () => {
      csvMapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'id', title: 'ID' },
          { name: 'name', title: 'Name' },
          { name: 'sku', title: 'SKU' }
        ],
        showUserControls: false
      });

      const csv = 'Id,Name,Sku\n1,John Doe,SKU123\n2,Jane Smith,SKU456';

      const mappedCsv = csvMapper.mapCsv(csv);

      expect(mappedCsv).toBeDefined();
      if (mappedCsv) {
        expect(mappedCsv.data).toBeDefined();
        expect(mappedCsv.csv).toBeDefined();
        expect(mappedCsv.validation).toBeDefined();

        expect(mappedCsv.csv).toBe('id,name,sku\r\n1,John Doe,SKU123\r\n2,Jane Smith,SKU456');
      }
    });
  });

  describe('Csv Output - no mapping', () => {
    test('should cleanup event listeners on destroy', () => {
      csvMapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'id', title: 'ID' },
          { name: 'name', title: 'Name' },
          { name: 'sku', title: 'SKU' },
          { name: 'category', title: 'Category', allowMultiple: true },
        ],
        showUserControls: false
      });

      const csv = 'Id,Name,Sku,Category 1,Category 2\n1,John Doe,SKU123,Electronics,Televisions\n2,Jane Smith,SKU456,Books,Sci-Fi';
      csvMapper.setCsv(csv);
      const mappedCsv = csvMapper.getMappedResult();

      expect(mappedCsv).toBeDefined();
      if (mappedCsv) {
        expect(mappedCsv.data).toBeDefined();
        expect(mappedCsv.csv).toBeDefined();
        expect(mappedCsv.validation).toBeDefined();

        expect(mappedCsv.csv).toBe('id,name,sku,category\r\n,,,\r\n,,,');
      }
    });
  });

  describe('Csv Output - multi mapping', () => {
    test('should cleanup event listeners on destroy', () => {
      csvMapper = new CsvMapper(fileInput, {
        columns: [
          { name: 'id', title: 'ID' },
          { name: 'name', title: 'Name' },
          { name: 'sku', title: 'SKU' },
          { name: 'category', title: 'Category', allowMultiple: true },
        ],
        showUserControls: false
      });

      const csv = 'Id,Name,Sku,Category 1,Category 2\n1,John Doe,SKU123,Electronics,Televisions\n2,Jane Smith,SKU456,Books,Sci-Fi';
      csvMapper.setCsv(csv);
      csvMapper.addColumnMapping('Id', 'id');
      csvMapper.addColumnMapping('Name', 'name');
      csvMapper.addColumnMapping('Sku', 'sku');
      csvMapper.addColumnMapping('Category 1', 'category');
      csvMapper.addColumnMapping('Category 2', 'category');
      const mappedCsv = csvMapper.getMappedResult();

      expect(mappedCsv).toBeDefined();
      if (mappedCsv) {
        expect(mappedCsv.data).toBeDefined();
        expect(mappedCsv.csv).toBeDefined();
        expect(mappedCsv.validation).toBeDefined();

        expect(mappedCsv.csv).toBe('id,name,sku,category,category\r\n1,John Doe,SKU123,Electronics,Televisions\r\n2,Jane Smith,SKU456,Books,Sci-Fi');
      }
    });
  });
});
