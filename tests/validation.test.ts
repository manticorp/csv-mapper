/**
 * Core CsvMapper functionality tests
 */

import CsvMapper from '../src/csvMapper';

describe('CsvMapper Validation', () => {
  let mapper: CsvMapper;

  beforeEach(() => {
  });

  afterEach(() => {
    if (mapper) {
      mapper.destroy();
    }
  });

  test('simple validation error', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'id',
          validate: () => { return false; }
        },
      ],
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalErrors).toBe(1);
    }
  });
  test('simple email validation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'email',
          validate: 'email'
        },
      ],
    });

    const result = mapper.mapCsv('email\ninvalid-email\nvalid@email.com');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalRows).toBe(2);
      expect(result.validation.errorRows).toBe(1);
      expect(result.validation.totalErrors).toBe(1);
      expect(result.validation.errorsByField.email).toBe(1);
    }
  });
  test('simple number validation', () => {
    const mapper = new CsvMapper({
      columns: [
        {
          name: 'qty',
          validate: 'number'
        },
      ],
    });

    const result = mapper.mapCsv(`qty
invalid-qty
10
1.234
-5
1e3
"1,234"
1234
-1234
1e10
-1E10
1.234
-1.234
+1234
"1,234,567.89"
"-1,234,567.89"
"+1,234,567.89"
"1 234 567.89"
"1'234'567.89"
"1_234_567.89"
"$1,234.56"
"€1.234,56"
"123%"
"(123.45)"
"1,2345678901"
"1,23456,78901"
`);
    console.log(result);
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalRows).toBe(25);
      expect(result.validation.errorRows).toBe(1);
      expect(result.validation.totalErrors).toBe(1);
      expect(result.validation.errorsByField.qty).toBe(1);
    }
  });
  test('simple boolean validation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'yesno',
          validate: 'boolean'
        },
      ],
    });

    const result = mapper.mapCsv(`id,yesno
1,y
1,n
1,yes
1,no
1,1
1,0
1,true
1,false
1,
1,maybe
`);
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalRows).toBe(10);
      expect(result.validation.errorRows).toBe(1);
      expect(result.validation.totalErrors).toBe(1);
      expect(result.validation.errorsByField.yesno).toBe(1);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].value).toBe('maybe');
    }
  });
  test('simple date validation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'what_day',
          validate: 'date'
        },
      ],
    });

    const result = mapper.mapCsv(`what_day
2023-01-01
2023-01-01T12:00:00Z
Thu Jan 01 1970 00:00:00 GMT-0500 (Eastern Standard Time)
"Thu, 01 Jan 1970 00:00:00 GMT"
2019-01-01T00:00:00
2019-01-01T00:00:00.000Z
2019-01-01T00:00:00.000+00:00
2025-12-31
12/31/2025
January 1, 2025
2025-09-12
2025/09/12
09-12-2025
12-09-2025
2025.09.12
"Fri, 12 Sep 2025 14:30:00 GMT"
September 12, 2025
12 September 2025
2025-09-12T14:30:00Z
2025-09-12T14:30:00+01:00
2025-09-12 14:30:00
2025/09/12 14:30
09/12/25
12/09/25
12-Sep-2025
Sep 12 2025
20250912
2025-W37-5
2025-256
2025 September 12 2:30pm
31/12/2025
2025-32-12
`);
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.validation.totalRows).toBe(32);
      expect(result.validation.errorRows).toBe(6);
      expect(result.validation.totalErrors).toBe(6);
      expect(result.validation.errorsByField.what_day).toBe(6);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors).toHaveLength(6);
      expect(result.validation.errors[0].value).toBe('20250912');
      expect(result.validation.errors[1].value).toBe('2025-W37-5');
      expect(result.validation.errors[2].value).toBe('2025-256');
      expect(result.validation.errors[3].value).toBe('2025 September 12 2:30pm');
      expect(result.validation.errors[4].value).toBe('31/12/2025');
      expect(result.validation.errors[5].value).toBe('2025-32-12');
    }
  });
  test('simple phone validation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'tel',
          validate: 'phone'
        },
      ],
    });

    const result = mapper.mapCsv(`tel
07899999999
+447899999999
+44 7899 999999
(123) 456-7890
01789 432156
abc
`);
    expect(result).not.toBeFalsy();
    if (result) {
      const errors = 1;
      expect(result.validation.totalRows).toBe(6);
      expect(result.validation.errorRows).toBe(errors);
      expect(result.validation.totalErrors).toBe(errors);
      expect(result.validation.errorsByField.tel).toBe(errors);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors).toHaveLength(errors);
      expect(result.validation.errors[0].value).toBe('abc');
    }
  });
  test('simple time validation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'when',
          validate: 'time'
        },
      ],
    });

    const result = mapper.mapCsv(`when
10:00
10:00:00
23:59
00:00
7:30
07:30
9AM
9PM
12:55PM
abc
`);
    expect(result).not.toBeFalsy();
    if (result) {
      const errors = 1;
      expect(result.validation.totalRows).toBe(10);
      expect(result.validation.errorRows).toBe(errors);
      expect(result.validation.totalErrors).toBe(errors);
      expect(result.validation.errorsByField.when).toBe(errors);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors).toHaveLength(errors);
      expect(result.validation.errors[0].value).toBe('abc');
    }
  });
});
