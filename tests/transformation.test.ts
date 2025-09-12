/**
 * Core CsvMapper functionality tests
 */

import CsvMapper, { TransformRule } from '../src/csvMapper';

describe('CsvMapper Validation', () => {
  let mapper: CsvMapper;

  beforeEach(() => {
  });

  afterEach(() => {
    if (mapper) {
      mapper.destroy();
    }
  });

  test('simple function transformation', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'id',
          transform: () => { return 'abc'; }
        },
      ],
    });

    const result = mapper.mapCsv('id\nB');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('abc');
    }
  });

  test('transformation function gets passed all correct args', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'id',
          title: 'Identifier',
          transform: (value, rowIndex, column, spec) => { return `${value};${rowIndex};${column};${spec.title}`; }
        },
      ],
    });

    const result = mapper.mapCsv('id\nA\nB\nC');
    expect(result).not.toBeFalsy();
    if (result) {
      expect(result.data).toBeDefined();
      expect(result.data.row(0).get('id')).toBe('A;0;id;Identifier');
      expect(result.data.row(1).get('id')).toBe('B;1;id;Identifier');
      expect(result.data.row(2).get('id')).toBe('C;2;id;Identifier');
    }
  });

  test('transformation to number', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'id',
          title: 'Identifier',
          transform: 'number'
        },
      ],
    });

    const result = mapper.mapCsv(`id
1
2.123
1e10
"1,234"
(1.1234)
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
a`);
    expect(result).not.toBeFalsy();
    if (result) {
      const expectations = [
        '1',
        '2.123',
        '10000000000',
        '1234',
        '-1.1234',
        '1234',
        '-1234',
        '10000000000',
        '-10000000000',
        '1.234',
        '-1.234',
        '1234',
        '1234567.89',
        '-1234567.89',
        '1234567.89',
        '1234567.89',
        '1234567.89',
        '1234567.89',
        '1234.56',
        '1234.56',
        '1.23',
        ''  // 'a' cannot be converted to number, becomes empty string
      ];
      expectations.forEach((expected, index) => {
        expect(result.data.row(index).get('id')).toBe(expected);
      });
    }
  });

  test('transformation to boolean', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'yesno',
          transform: 'boolean'
        },
      ],
    });

    const result = mapper.mapCsv(`yesno
yes
no
y
n
true
false
YES
NO
TRUE
FALSE
1
0
a`);
    expect(result).not.toBeFalsy();
    if (result) {
      const expectations = [
        '1',
        '0',
        '1',
        '0',
        '1',
        '0',
        '1',
        '0',
        '1',
        '0',
        '1',
        '0',
        '1',
      ];
      expectations.forEach((expected, index) => {
        expect(result.data.row(index).get('yesno')).toBe(expected);
      });
    }
  });

  test('transformation to date', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'when',
          transform: 'date'
        },
      ],
    });

    const result = mapper.mapCsv(`when
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
2025-32-12`);
    expect(result).not.toBeFalsy();
    if (result) {
      const expectations = [
        'Sun Jan 01 2023 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Sun Jan 01 2023 12:00:00 GMT+0000 (Greenwich Mean Time)',
        'Thu Jan 01 1970 06:00:00 GMT+0100 (Greenwich Mean Time)',
        'Thu Jan 01 1970 01:00:00 GMT+0100 (Greenwich Mean Time)',
        'Tue Jan 01 2019 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Tue Jan 01 2019 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Tue Jan 01 2019 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Wed Dec 31 2025 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Wed Dec 31 2025 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Mon Jan 01 2001 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Fri Sep 12 2025 01:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Tue Dec 09 2025 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 15:30:00 GMT+0100 (British Summer Time)',
        'Wed Sep 12 2001 00:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 15:30:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 14:30:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 14:30:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 14:30:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Tue Dec 09 2025 00:00:00 GMT+0000 (Greenwich Mean Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Fri Sep 12 2025 00:00:00 GMT+0100 (British Summer Time)',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date'
      ];
      expectations.forEach((expected, index) => {
        expect(result.data.row(index).get('when')).toBe(expected);
      });
    }
  });

  test('transformation to date - set format', () => {
    mapper = new CsvMapper({
      columns: [
        {
          name: 'when',
          transform: {
            type: 'date',
            format: 'Y-m-d'
          }
        },
      ],
    });

    const result = mapper.mapCsv(`when
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
2025-32-12`);
    expect(result).not.toBeFalsy();
    if (result) {
      console.log(result.data);
      const expectations = [
        '2023-01-01',
        '2023-01-01',
        '1970-01-01',
        '1970-01-01',
        '2019-01-01',
        '2019-01-01',
        '2019-01-01',
        '2025-12-31',
        '2025-12-31',
        '2001-01-01',
        '2025-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-12-09',
        '2025-09-12',
        '2025-09-12',
        '2001-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-09-12',
        '2025-12-09',
        '2025-09-12',
        '2025-09-12',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date',
        'Invalid Date'
      ];
      expectations.forEach((expected, index) => {
        expect(result.data.row(index).get('when')).toBe(expected);
      });
    }
  });

  test('transformation to date - different formats', () => {
    const formats = [
      ['Y-m-d', '2025-09-12'],
      ['Y-m-d\\TH:i:sP', '2025-09-12T14:30:00+01:00'],
      ['D M d Y H:i:s \\G\\M\\TP (e)', 'Fri Sep 12 2025 14:30:00 GMT+01:00 (Europe/London)'],
    ];

    for (const [informat, outformat] of formats) {
      const mapper = new CsvMapper({
        columns: [
          {
            name: 'when',
            transform: {
              type: 'date',
              format: informat
            },
          },
        ],
      });

      mapper.mapCsv(`when
2025-09-12T14:30:00+01:00`);
      // @ts-ignore
      mapper.columns[0].transform.format = informat;
      const result = mapper.getMappedResult();
      expect(result).not.toBeFalsy();
      console.log(result);
      if (result) {
        expect(result.data.row(0).get('when')).toBe(outformat);
      }
    }
  });
});
