import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8081;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files from the demo directory
app.use(express.static(__dirname));
app.use('/dist', express.static(path.join(__dirname, '../../dist')));

// Parse JSON bodies
app.use(express.json());

// Serve the demo page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple.html'));
});

app.post('/upload', upload.single('csv'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        // Get the CSV content
        const csvContent = req.file.buffer.toString('utf-8');

        // Get mapping data if provided
        const mappingData = req.body.mapping ? JSON.parse(req.body.mapping) : null;

        console.log('=== CSV Upload Received ===');
        console.log('Original filename:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');
        console.log('Mapping data:', mappingData);
        console.log('CSV Content:');
        console.log(csvContent);
        console.log('=========================');

        // Echo back the data
        res.json({
            success: true,
            message: 'CSV received and processed successfully',
            data: {
                originalFilename: req.file.originalname,
                fileSize: req.file.size,
                csvContent: csvContent,
                mappingData: mappingData,
                rowCount: csvContent.split('\n').filter(line => line.trim()).length
            }
        });

    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({
            error: 'Failed to process CSV',
            details: error.message
        });
    }
});

// Handle CSV upload
app.post('/upload-csv', upload.single('csv'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get the CSV content
        const csvContent = req.file.buffer.toString('utf-8');

        // Get mapping data if provided
        const mappingData = req.body.mapping ? JSON.parse(req.body.mapping) : null;

        console.log('=== CSV Upload Received ===');
        console.log('Original filename:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');
        console.log('Mapping data:', mappingData);
        console.log('CSV Content:');
        console.log(csvContent);
        console.log('=========================');

        // Echo back the data
        res.json({
            success: true,
            message: 'CSV received and processed successfully',
            data: {
                originalFilename: req.file.originalname,
                fileSize: req.file.size,
                csvContent: csvContent,
                mappingData: mappingData,
                rowCount: csvContent.split('\n').filter(line => line.trim()).length
            }
        });

    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({
            error: 'Failed to process CSV',
            details: error.message
        });
    }
});

// Handle remapped CSV upload (when remap: true is used)
app.post('/upload-remapped-csv', upload.single('csv'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No remapped file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');

        console.log('=== Remapped CSV Received ===');
        console.log('Original filename:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');
        console.log('Remapped CSV Content:');
        console.log(csvContent);
        console.log('============================');

        res.json({
            success: true,
            message: 'Remapped CSV received successfully',
            data: {
                originalFilename: req.file.originalname,
                fileSize: req.file.size,
                csvContent: csvContent,
                rowCount: csvContent.split('\n').filter(line => line.trim()).length
            }
        });

    } catch (error) {
        console.error('Error processing remapped CSV:', error);
        res.status(500).json({
            error: 'Failed to process remapped CSV',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`CSV Mapper Server Demo running at http://localhost:${port}`);
    console.log('Upload a CSV file to test the mapping functionality');
});
