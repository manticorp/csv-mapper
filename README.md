# CSV remapper

Dynamically remap CSV columns, with a user UI for mapping columns.

Set your expectations so that you receive the right input.

It allows you to:

* Take a file input that accepts CSVs
* Perform a dynamic mapping of columns (presenting a mapping UI to the user)
* Allow specifying accepted columns
* Do smart auto mapping
* Perform basic or advanced validation

## Features:

* Column validation
* Normalisation (e.g. boolean to => 0/1)
* Intercept upload and upload edited/parsed/mapped csv instead
* **Robust CSV parsing** with support for multiline fields using bundled PapaParse
* **Advanced dialect detection** for separators, quotes, and escape characters
* **Proper handling of line breaks** within quoted CSV fields
* **No external dependencies** - PapaParse is bundled with the library

## Installation

The library is completely self-contained with PapaParse bundled inside. No additional dependencies required!

# Usage

```html
<input id="csv" type="file" accept=".csv">
<script type="module">
import CsvMapper from "./../dist/csv-mapper.js";

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

# Advanced Usage

```html
<input id="csv" type="file" accept=".csv">
<input id="map" type="hidden">
<div id="remapping-controls"></div>
<script type="module">
import CsvMapper from "./../dist/csv-mapper.js";

const mapper = new CsvMapper('#csv', {
    columns: [
        'sku',
        'barcode',
        'price',
        'qty'
    ],

    separator: '', // auto when falsy/empty string
    enclosure: '', // auto when falsy/empty string
    escape: '', // auto when falsy/empty string; fallback to doubling
    guessMaxLines: 25, // How many lines to use for auto dialect parsing

    // Output dialect for remap (null => inherit detected input; fallback comma+")
    outputSeparator: null,
    outputEnclosure: null,
    outputEscape: null,

    // Library behavior
    headers: true, // Whether csv file has headers
    remap: true, // whether to re-write original csv with new structure
    showUserControls: true, // Whether to show the user remapping or not
    mappingInput: '#map', // HTMLElement | false
    controlsContainer: '#remapping-controls', // selector | element | null
    autoThreshold: 0.8,
    allowUnmappedTargets: true,
});
</script>
```

## CSV Parsing Capabilities

The library now uses PapaParse for robust CSV parsing that properly handles:

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