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
    beforeParse: (e) => {}, // see below
    beforeMap: (e) => {}, // see below
    afterMap: (e) => {}, // see below
});

mapper.addEventListener('beforeParse', (e) => {
    console.log('CSV string', e.detail.text);
});

mapper.addEventListener('beforeMap', (e) => {
    console.log('CSV rows', e.detail.rows);
});

mapper.addEventListener('afterMap', (e) => {
    console.log('Mapped rows:', e.detail.rows);
    console.log('CSV (if remap:true):', e.detail.csv);
});
</script>
```