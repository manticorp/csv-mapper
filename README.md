# CSV remapper

Do you need to accept CSV files from a user? Then this library is for you!

![Simple example](docs/im/simple_example.png)

Dynamically remap CSV columns, with a user UI for mapping columns.

Set your expectations so that you receive the right input.

It allows you to:

* Take a file input that accepts CSVs
* Perform a dynamic mapping of columns (optionally presenting a mapping UI to the user)
* Allow specifying accepted columns
* Do smart auto mapping
* Perform basic or advanced validation and transformation

## Features:

* Column validation *(via column ```validation``` options)*
* Column transformation
* Intercept upload and upload edited/parsed/mapped csv instead *(via ```remap``` option)*
* **Robust CSV parsing** using bundled PapaParse
* **Advanced dialect detection** for separators, quotes, and escape characters
* **Proper handling of line breaks** within quoted CSV fields

# Installation

Can be used in browser or node, and can be used as a module or a standalone.

Recommended browser use is standalone.

```html
<input id="csv" type="file" accept=".csv">
<script src="csv-mapper/dist/csv-mapper.umd.min.js"></script>
<script>
const mapper = new CsvMapper('#csv', {columns: ['name', 'id']});
</script>
```

# Usage

This is a minimal example:

```html
<input id="csv" type="file" accept=".csv">
<script type="module">
import CsvMapper from "./csv-mapper/dist/csv-mapper.esm.min.js";

const mapper = new CsvMapper('#csv', {
    columns: [
        'sku',
        'barcode',
        'price',
        'qty'
    ],
});
</script>
```

When the user clicks on the file upload button, a UI will appear allowing remapping from columns in the config columns to columns in the input CSV.

## CSV Parsing Capabilities

The library uses [PapaParse](https://www.papaparse.com/) for robust CSV parsing that properly handles:

### Multiline Fields
```csv
product_id,name,description
1,"Multi-line
Product Name
With Breaks","Long description here"
2,"Another Product","Simple description"
```

### Various Quote Styles
- Standard double quotes: `"field with spaces"`
- Escaped quotes: `"field with ""quotes"" inside"`
- Mixed content: `"field with, comma and ""quotes"""`

### Different Separators and Dialects
- Comma-separated (CSV): `field1,field2,field3`
- Semicolon-separated: `field1;field2;field3`
- Tab-separated (TSV): `field1	field2	field3`
- Pipe-separated: `field1|field2|field3`

The library automatically detects the dialect or you can specify it explicitly.

# No UI option

CsvMapper can optionally be run using no UI.

Here is an example using no UI:

```javascript
    const columns = [
        'id',
        'name',
        'address_line_1',
        'address_line_2',
        {
            name: 'town',
            transform: ['title']
        },
        {
            name: 'county',
            match: (header) => ['county', 'state', 'region'].includes(header.trim().toLowerCase())
        },
        {
            name: 'postcode',
            match: (header) => ['postcode', 'postalcode', 'zip'].includes(header.replace(/\s*/g, '').toLowerCase()),
            required: true
        },
    ];
    const csvMapper = new CsvMapper({
        columns,
    });

    const csv = `id,name,address_line_1,town,state,zip
1,John,123 fake street,Fakesham,Fakesberg,12345;
2,Mary,456 Real Road,margheritavill,,67890`;

    const result = csvMapper.mapCsv(csv);
    if (result) {
        console.log(result.csv);
        // and upload to server, or save, or whatver.
    }

```

# Advanced Configuration

```html
<input id="csv" type="file" accept=".csv">
<input id="map" type="hidden">
<div id="remapping-controls"></div>
<script type="module">
import CsvMapper from "./../dist/csv-mapper.js";

const columns = [
    'name',
    {name: 'barcode', outputHeader: 'upc'},
    {name: 'sku', title: 'SKU'},
];

const mapper = new CsvMapper('#csv', {
    columns: columns,                   // Column specification

    // Parsing/dialect
    headers: true,
    separator: '',
    enclosure: '',
    escape: '',

    output: {
        generateCsv: true, // Whether to generate output CSV string
        delimiter: ',',
        quoteChar: '"',
        escapeChar: '\\',
        newline: '\n',
        allowUnmappedTargets: false, // Whether to allow csv columns that are unmapped in the input into the output
    },

    // Library behavior
    remap: true,                   // Whether to attempt remapping
    showUserControls: true,        // Defaults to true if input is present, false if not
    mappingInput: null,            // HTMLElement | false
    controlsContainer: null,       // selector | element | null
    autoThreshold: 0.8,            // Similarity threshold for auto column mapping
    setInputValidity: false,       // Whether to use setCustomValidity on the file input
    mappingMode: 'configToCsv',    // Default mapping direction
    allowMultipleSelection: false, // Whether to allow many-to-many mapping

    uiRenderer: null,              // UI renderer - accepts string ("default") or a renderer object
    transformer: null,             // Data transformer/validator
    parser: null,                  // CSV parser
});
</script>
```

The columns object has many different options:

```javascript
const columns = [ // Columns should be an array
    'id', // You can pass a simple string
    'name',
    {     // Or it can be defined with an object
        name: 'sku',
        validate: /^SKU[0-9]+$/
    },
    {
        // This, by default, is used for the output csv header and UI display.
        name: 'barcode',

        // This displays in the UI.
        title: 'Barcode',

        // This displays in the UI as a tooltip (title="description").
        description: 'The UPC barcode',

        // This displays in the UI as a visible comment.
        comment: 'must be of the format 01234567890',

        // This will be what's used in the remapped output.
        outputHeader: 'UPC',

        // Default value to be used if not present in mapping.
        defaultValue: '0',

        // Whether the column is required for remapping (default: false).
        required: true,

        // Whether the column is allowed to be mapped multiple times.
        allowDuplicates: false,

        // Function/regex for matching to supplied CSV headers.
        match: (header) => ['barcode', 'upc', 'isbn'].includes(header.toLowerCase()),

        // A transformation function or list of transformions. Some default built ins are provided which you can reference by string.
        transform: ['string', 'upper', (str) => str.split('-').map(a => a.trim()).join('')],

        // A string (e.g. 'email', 'date'), regex or function for validation.
        validate: /^(?=.*0)[0-9]{12}$/,

        // Validation message supplied to the user.
        validationMessage: '"Barcode" should be a valid UPC-A barcode.',
    }
];
```