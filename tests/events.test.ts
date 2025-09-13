/**
 * Core CsvMapper functionality tests
 */

import CsvMapper from '../src/csvMapper';

describe('CsvMapper Events', () => {
  test('beforeParseCsv allows changing of CSV text', () => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('beforeParseCsv', (e) => {
      (e as CustomEvent).detail.csv = `id,sku\n1,abc`;
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('1');
      expect(result.data.row(0).get('sku')).toBe('abc');
    }
  });
  test('afterParseCsv allows changing of CSV rows', () => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('afterParseCsv', (e) => {
      (e as CustomEvent).detail.csv.headers = ['id','sku'];
      (e as CustomEvent).detail.csv.rawRows = [['2','def']];
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('2');
      expect(result.data.row(0).get('sku')).toBe('def');
    }
  });

  test('afterRead allows changing of CSV text', (done) => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('afterRead', (e) => {
      try {
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.text).toBeDefined();
        expect((e as CustomEvent).detail.text).toBe('original\ntext');
        
        // Modify the CSV text
        (e as CustomEvent).detail.text = 'id,sku\nmodified,data';
        done();
      } catch (error) {
        done(error);
      }
    });

    // Create a mock file with text() method
    const mockFile = {
      text: jest.fn().mockResolvedValue('original\ntext'),
      name: 'test.csv'
    } as any;
    
    mapper.setFile(mockFile);
  });

  test('mappingChange is triggered when mapping changes', (done) => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    let changeCount = 0;
    mapper.addEventListener('mappingChange', (e) => {
      try {
        changeCount++;
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.mapping).toBeDefined();
        
        if (changeCount === 1) {
          // First change should be the auto-mapping
          expect((e as CustomEvent).detail.mapping).toHaveProperty('id');
          expect((e as CustomEvent).detail.mapping.id).toBe('id');
        } else if (changeCount === 2) {
          // Second change should be our manual mapping - can be array due to many-to-many mapping
          expect((e as CustomEvent).detail.mapping).toHaveProperty('id');
          const idMapping = (e as CustomEvent).detail.mapping.id;
          if (Array.isArray(idMapping)) {
            expect(idMapping).toContain('sku');
          } else {
            expect(idMapping).toBe('sku');
          }
          done();
        }
      } catch (error) {
        done(error);
      }
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    
    // Trigger another mapping change
    mapper.addColumnMapping('id', 'sku');
  });

  test('mappingFailed is triggered when required columns are missing', (done) => {
    const mapper = new CsvMapper({
      columns: [
        { name: 'id', required: true },
        { name: 'sku', required: true }
      ],
    });

    mapper.addEventListener('mappingFailed', (e) => {
      try {
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.isValid).toBe(false);
        expect((e as CustomEvent).detail.missingRequired).toBeDefined();
        expect((e as CustomEvent).detail.missingRequired).toContain('sku');
        expect((e as CustomEvent).detail.mappedTargets).toBeDefined();
        expect((e as CustomEvent).detail.mapping).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    // This CSV only has 'id' column, missing required 'sku'
    // The result will be falsy due to mapping failure
    const result = mapper.mapCsv('id\nB');
    expect(result).toBeFalsy();
  });

  test('mappingSuccess is triggered when all required columns are mapped', (done) => {
    const mapper = new CsvMapper({
      columns: [
        { name: 'id', required: true },
        { name: 'sku', required: false }
      ],
    });

    mapper.addEventListener('mappingSuccess', (e) => {
      try {
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.isValid).toBe(true);
        expect((e as CustomEvent).detail.mappedTargets).toBeDefined();
        expect((e as CustomEvent).detail.mappedTargets).toContain('id');
        expect((e as CustomEvent).detail.mapping).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    // This CSV has required 'id' column
    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
  });

  test('beforeMap allows canceling the mapping process', () => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('beforeMap', (e) => {
      expect((e as CustomEvent).detail).toBeDefined();
      expect((e as CustomEvent).detail.csv).toBeDefined();
      // Cancel the mapping process
      e.preventDefault();
    });

    const result = mapper.mapCsv('id\nB');
    // Result should be falsy because we prevented the mapping
    expect(result).toBeFalsy();
  });

  test('afterMap is triggered after mapping validation', (done) => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('afterMap', (e) => {
      try {
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.csv).toBeDefined();
        expect((e as CustomEvent).detail.isValid).toBeDefined();
        expect(typeof (e as CustomEvent).detail.isValid).toBe('boolean');
        done();
      } catch (error) {
        done(error);
      }
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
  });

  test('beforeRemap allows canceling the remapping process', () => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('beforeRemap', (e) => {
      expect((e as CustomEvent).detail).toBeDefined();
      expect((e as CustomEvent).detail.csv).toBeDefined();
      // Cancel the remapping process
      e.preventDefault();
    });

    const result = mapper.mapCsv('id\nB');
    // Result should be falsy because we prevented the remapping
    expect(result).toBeFalsy();
  });

  test('afterRemap', (done) => {
    const mapper = new CsvMapper({
      columns: [
        'id',
        'sku'
      ],
    });

    mapper.addEventListener('afterRemap', (e) => {
      try {
        expect((e as CustomEvent).detail.rows).toBeDefined();
        expect((e as CustomEvent).detail.csv).toBeDefined();
        done();
      } catch (e) {
        done(e);
      }
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.csv).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('B');
      expect(result.data.row(0).get('sku')).toBeNull();
    } else {
      done(new Error('No result from mapCsv'));
    }
  });

  test('validationFailed', (done) => {
    const spy = jest.fn(() => false);
    let hadError : any = false;
    const mapper = new CsvMapper({
      columns: [
        { name:'id', validate: spy },
        'sku'
      ],
    });

    mapper.addEventListener('validationFailed', (e) => {
      try {
        expect((e as CustomEvent).detail).toHaveProperty('data');
        expect((e as CustomEvent).detail).toHaveProperty('csv');
        expect((e as CustomEvent).detail).toHaveProperty('validation');
        expect((e as CustomEvent).detail.validation).toHaveProperty('errors');
        expect((e as CustomEvent).detail.validation).toHaveProperty('totalErrors');
        expect((e as CustomEvent).detail.validation).toHaveProperty('totalRows');
        expect((e as CustomEvent).detail.validation.totalRows).toBe(1);
        expect((e as CustomEvent).detail.validation.errorRows).toBe(1);
        expect((e as CustomEvent).detail.validation.errors).toHaveLength(1);
        expect((e as CustomEvent).detail.validation.totalErrors).toBe(1);
      } catch (error) {
        hadError = true;
        done(error);
      }
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    expect(spy).toHaveBeenCalledTimes(1);
    if (result) {
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('csv');
      expect(result).toHaveProperty('validation');
      expect(result.validation).toHaveProperty('errors');
      expect(result.validation).toHaveProperty('totalErrors');
      expect(result.validation).toHaveProperty('totalRows');
      expect(result.validation.totalRows).toBe(1);
      expect(result.validation.errorRows).toBe(1);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.totalErrors).toBe(1);
      if (!hadError) {
        done();
      }
    } else {
      done(new Error('No result from mapCsv'));
    }
  });

  test('validationSuccess', (done) => {
    const spy = jest.fn(() => true);
    const mapper = new CsvMapper({
      columns: [
        { name:'id', validate: spy },
        'sku'
      ],
    });

    mapper.addEventListener('validationSuccess', (e) => {
      try {
        expect((e as CustomEvent).detail).toHaveProperty('data');
        expect((e as CustomEvent).detail).toHaveProperty('csv');
        expect((e as CustomEvent).detail).toHaveProperty('validation');
        expect((e as CustomEvent).detail.validation).toHaveProperty('errors');
        expect((e as CustomEvent).detail.validation).toHaveProperty('totalErrors');
        expect((e as CustomEvent).detail.validation).toHaveProperty('totalRows');
        expect((e as CustomEvent).detail.validation.totalRows).toBe(1);
        expect((e as CustomEvent).detail.validation.errorRows).toBe(0);
        expect((e as CustomEvent).detail.validation.errors).toHaveLength(0);
        expect((e as CustomEvent).detail.validation.totalErrors).toBe(0);
      } catch (error) {
        done(error);
      }
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    expect(spy).toHaveBeenCalledTimes(1);
    if (result) {
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('csv');
      expect(result).toHaveProperty('validation');
      expect(result.validation).toHaveProperty('errors');
      expect(result.validation).toHaveProperty('totalErrors');
      expect(result.validation).toHaveProperty('totalRows');
      expect(result.validation.totalRows).toBe(1);
      expect(result.validation.errorRows).toBe(0);
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.totalErrors).toBe(0);
      done();
    } else {
      done(new Error('No result from mapCsv'));
    }
  });

  test('transformationFail', () => {
    const mapper = new CsvMapper({
      columns: [
        {name:'id', transform: (val) => { throw new Error('Fail'); } },
        'sku'
      ],
    });

    mapper.addEventListener('transformationFail', (e) => {
      expect((e as CustomEvent).detail).toBeDefined();
      expect((e as CustomEvent).detail.rowIndex).toBeDefined();
      expect((e as CustomEvent).detail.columnName).toBeDefined();
      expect((e as CustomEvent).detail.value).toBeDefined();
      expect((e as CustomEvent).detail.message).toBeDefined();
      expect((e as CustomEvent).detail.rowIndex).toBe(0);
      expect((e as CustomEvent).detail.columnName).toBe('id');
      expect((e as CustomEvent).detail.value).toBe('B');
      expect((e as CustomEvent).detail.message).toBe('Fail');
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('B');
      expect(result.data.row(0).get('sku')).toBeNull();
    }
  });

  test('transformationFail - when default prevented, rethrows', () => {
    const t = () => {
      const mapper = new CsvMapper({
        columns: [
          {name:'id', transform: (val) => { throw new Error('Fail'); } },
          'sku'
        ],
      });

      mapper.addEventListener('transformationFail', (e) => {
        expect((e as CustomEvent).detail).toBeDefined();
        expect((e as CustomEvent).detail.rowIndex).toBeDefined();
        expect((e as CustomEvent).detail.columnName).toBeDefined();
        expect((e as CustomEvent).detail.value).toBeDefined();
        expect((e as CustomEvent).detail.message).toBeDefined();
        expect((e as CustomEvent).detail.rowIndex).toBe(0);
        expect((e as CustomEvent).detail.columnName).toBe('id');
        expect((e as CustomEvent).detail.value).toBe('B');
        expect((e as CustomEvent).detail.message).toBe('Fail');
        e.preventDefault();
      });

      mapper.mapCsv('id\nB');
    }
    expect(t).toThrow(Error);
    expect(t).toThrow('Fail');
  });

  test('validationFail', (done) => {
    const mapper = new CsvMapper({
      columns: [
        {name:'id', validate: (val) => val === 'A' ? true : 'ID must be A' },
      ],
    });

    mapper.addEventListener('validationFail', (e) => {
      expect((e as CustomEvent).detail).toBeDefined();
      expect((e as CustomEvent).detail.rowIndex).toBeDefined();
      expect((e as CustomEvent).detail.value).toBeDefined();
      expect((e as CustomEvent).detail.columnName).toBeDefined();
      expect((e as CustomEvent).detail.message).toBeDefined();
      expect((e as CustomEvent).detail.rowIndex).toBe(1);
      expect((e as CustomEvent).detail.value).toBe('B');
      expect((e as CustomEvent).detail.columnName).toBe('id');
      expect((e as CustomEvent).detail.message).toBe('ID must be A');
      done();
    });

    const result = mapper.mapCsv('id\nA\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalErrors).toBe(1);
      expect(result.validation.errors[0].message).toBe('ID must be A');
    }
  });

});
