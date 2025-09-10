import {Csv} from '../src/csv/csv.js';
import {CsvRow} from '../src/csv/row.js';

describe('Csv', () => {
    test('Simple CSV operation by row', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const csv = new Csv([row1Data], ['header1', 'header2', 'header3']);
        const row = csv.current() as CsvRow;
        expect(row).toBeInstanceOf(CsvRow);
        expect(row.data).toEqual(row1Data);
    });
    test('Iterator', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const csv = new Csv([row1Data], ['header1', 'header2', 'header3']);
        for (const row of csv) {
            expect(row).toBeInstanceOf(CsvRow);
            expect(row.data).toEqual(row1Data);
        }
    });
    test('Iterator with lots of rows', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        let i = 0;
        for (const row of csv) {
            expect(row).toBeInstanceOf(CsvRow);
            i++;
        }
        expect(i).toBe(2);
    });
    test('rewind', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        csv.next();
        const row = csv.nextRow() as CsvRow;
        expect(row).toBeInstanceOf(CsvRow);
        expect(row.data).toEqual(row2Data);

        csv.rewind();
        const row2 = csv.nextRow() as CsvRow;
        expect(row2).toBeInstanceOf(CsvRow);
        expect(row2.data).toEqual(row1Data);
    });
    test('map returns new Csv', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        const newCsv = csv.map((row) => {
            return [1, 2, ...row].slice(0, 3);
        });
        expect(newCsv).not.toBe(Csv);
        expect(newCsv).toBeInstanceOf(Csv);
        expect(newCsv.headers).toEqual(['header1', 'header2', 'header3']);
        expect(newCsv.nextRow()?.data).toEqual([1, 2, 'value1']);
        expect(newCsv.nextRow()?.data).toEqual([1, 2, 'value4']);
        expect(csv).toBeInstanceOf(Csv);
        expect(csv.headers).toEqual(['header1', 'header2', 'header3']);
        expect(csv.nextRow()?.data).toEqual(row1Data);
        expect(csv.nextRow()?.data).toEqual(row2Data);
    });
    test('toString', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        const result = csv.toString();
        expect(result).toMatch(`header1,header2,header3\r\nvalue1,value2,value3\r\nvalue4,value5,value6`);
    });
    test('toString with needing quotes', () => {
        const row1Data = ['value1', 'value2 with "some quoted string" in it, and delimeters', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        const result = csv.toString();
        expect(result).toMatch(`header1,header2,header3\r\nvalue1,\"value2 with \"\"some quoted string\"\" in it, and delimeters\",value3\r\nvalue4,value5,value6`);
    });
    test('toString with custom args', () => {
        const row1Data = ['value1', 'value2 with "some quoted string" in it, and delimeters', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        const result = csv.toString({
            quoteChar: '+',
            escapeChar: '#',
            delimiter: "@",
            header: false,
            newline: "\n",
        });
        expect(result).toMatch(`value1@+value2 with \"some quoted string\" in it, and delimeters+@value3\nvalue4@value5@value6`);
    });
    test('renameColumn', () => {
        const row1Data = ['value1', 'value2', 'value3'];
        const row2Data = ['value4', 'value5', 'value6'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        csv.renameColumn('header1', 'foo');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers[0]).toBeDefined();
            expect(csv.headers[0]).toMatch(`foo`);
            const result = csv.toString();
            expect(result).toBe(`foo,header2,header3\r\nvalue1,value2,value3\r\nvalue4,value5,value6`);
        } else {
            throw new Error('Headers are not defined');
        }
    });
    test('renameColumn with multiple of the same name', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3', 'header3']);
        csv.renameColumn('header3', 'foo');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers[2]).toBeDefined();
            expect(csv.headers[3]).toBeDefined();
            expect(csv.headers[2]).toMatch(`foo`);
            expect(csv.headers[3]).toMatch(`foo`);
        }
        const result = csv.toString();
        expect(result).toMatch(`header1,header2,foo,foo\r\n${row1Data.join(",")}\r\n${row2Data.join(",")}`);
    });
    test('removeColumn - simple case', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3', 'header3']);
        csv.removeColumn('header1');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(3);
            const result = csv.toString();
            expect(result).toMatch(`header2,header3,header3\r\nrow1value2,row1value3,row1value4\r\nrow2value2,row2value3,row2value4`);
        }
    });
    test('removeColumn - multiple case', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3', 'header3']);
        csv.removeColumn('header3');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(2);
            const result = csv.toString();
            expect(result).toMatch(`header1,header2\r\nrow1value1,row1value2\r\nrow2value1,row2value2`);
        }
    });
    test('reorderColumns - simple', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3']);
        csv.reorderColumns(['header3', 'header2', 'header1']);
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(3);
        }
        const result = csv.toString();
        expect(result).toMatch(`header3,header2,header1\r\nrow1value3,row1value2,row1value1\r\nrow2value3,row2value2,row2value1`);
    });
    test('reorderColumns - advanced', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3', 'header3']);
        csv.reorderColumns(['header3', 'header2', 'header1']);
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(4);
        }
        const result = csv.toString();
        expect(result).toMatch(`header3,header3,header2,header1\r\nrow1value3,row1value4,row1value2,row1value1\r\nrow2value3,row2value4,row2value2,row2value1`);
    });
    test('remapColumn - simple', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data, row2Data], ['header1', 'header2', 'header3', 'header3']);
        csv.remapColumn('header1', 'foo');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(4);
        }
        const result = csv.toString();
        expect(result).toMatch(`foo,header2,header3,header3\r\n${row1Data.join(",")}\r\n${row2Data.join(",")}`);
    });
    test('remapColumn - to multi', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data.slice(), row2Data.slice()], ['header1', 'header2', 'header3', 'header3']);
        csv.remapColumn('header1', ['foo', 'bar']);
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(5);
        }
        const result = csv.toString();
        expect(result).toMatch(`foo,header2,header3,header3,bar\r\n${row1Data.join(",")},row1value1\r\n${row2Data.join(",")},row2value1`);
    });
    test('addColumn - simple', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data.slice(), row2Data.slice()], ['header1', 'header2', 'header3', 'header3']);
        csv.addColumn('header4', null, 'default value');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(5);
        }
        const result = csv.toString();
        expect(result).toMatch(`header1,header2,header3,header3,header4\r\n${row1Data.join(",")},default value\r\n${row2Data.join(",")},default value`);
    });
    test('addColumn - after another', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data.slice(), row2Data.slice()], ['header1', 'header2', 'header3', 'header3']);
        csv.addColumn('header4', 'header1', 'default value');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(5);
        }
        const result = csv.toString();
        expect(result).toMatch(`header1,header4,header2,header3,header3\r\nrow1value1,default value,row1value2,row1value3,row1value4\r\nrow2value1,default value,row2value2,row2value3,row2value4`);
    });
    test('addColumn - no default', () => {
        const row1Data = ['row1value1', 'row1value2', 'row1value3', 'row1value4'];
        const row2Data = ['row2value1', 'row2value2', 'row2value3', 'row2value4'];
        const csv = new Csv([row1Data.slice(), row2Data.slice()], ['header1', 'header2', 'header3', 'header3']);
        csv.addColumn('header4');
        expect(csv.headers).toBeDefined();
        if (csv.headers) {
            expect(csv.headers.length).toBe(5);
        }
        const result = csv.toString();
        expect(result).toMatch(`header1,header2,header3,header3,header4\r\n${row1Data.join(",")},\r\n${row2Data.join(",")},`);
    });
});

describe('CsvRow', () => {
    test('CsvRow get', () => {
        const row = new CsvRow(1, ['value1', 'value2', 'value3'], ['header1', 'header2', 'header3']);
        const result = row.get('header3');
        expect(result).toEqual('value3');
    });
    test('CsvRow get with multiple of same column name', () => {
        const row = new CsvRow(1, ['value1', 'value2', 'value3', 'value4'], ['header1', 'header2', 'header3', 'header3']);
        const result = row.get('header3');
        expect(result).toEqual(['value3', 'value4']);
    });
    test('CsvRow arrange', () => {
        const row = new CsvRow(1, ['value1', 'value2', 'value3'], ['header1', 'header2', 'header3']);
        const result = row.arrange(['header3', 'header1']);
        expect(result).toEqual(['value3', 'value1']);
    });
    test('CsvRow arrange with repeats', () => {
        const row = new CsvRow(1, ['ABC123', 'Home', 'Upholstery', '2.99'], ['product_id', 'category', 'category', 'price']);
        const result = row.arrange(['price', 'category', 'category', 'product_id']);
        expect(result).toEqual(['2.99', 'Home', 'Upholstery', 'ABC123']);
    });
});
