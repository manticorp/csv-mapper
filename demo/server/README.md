# CSV Mapper Server Demo

This demo shows how to use CSV Mapper with a Node.js server that accepts file uploads.

## Setup

1. Navigate to the server demo directory:
   ```bash
   cd demo/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. Open your browser and go to: http://localhost:3000

## Features

- **File Upload**: Upload CSV files through a web interface
- **Column Mapping**: Interactive UI for mapping CSV columns to expected fields
- **Server Processing**: Server receives both original and remapped CSV data
- **Response Echo**: Server logs and returns the processed data

## Expected Columns

The demo expects these columns:
- `product_id` - Unique product identifier
- `name` - Product name  
- `price` - Product price
- `category` - Product category
- `stock` - Stock quantity

## Test Data

Use the included `sample.csv` file to test the mapping functionality. It has different column names that will trigger the mapping interface:
- `product_name` → `name`
- `item_code` → `product_id`
- `unit_price` → `price`
- `category_name` → `category`
- `quantity_available` → `stock`

## How It Works

1. **Upload**: Select a CSV file using the file input
2. **Parse**: CSV Mapper parses the file and detects columns
3. **Map**: If column names don't match exactly, a mapping interface appears
4. **Submit**: The form sends both original data and mapping information to the server
5. **Process**: Server receives and logs the data, then sends back a response
6. **Display**: The response is shown in the browser

## Server Endpoints

- `GET /` - Serves the demo page
- `POST /upload-csv` - Handles CSV file uploads with mapping data
- `POST /upload-remapped-csv` - Handles remapped CSV files (when remap: true)

The server will log all received data to the console for debugging and testing purposes.
