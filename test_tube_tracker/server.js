// server.js
const express = require('express');
const fs = require('fs').promises; // Use promises version of file system module
const path = require('path');

const app = express();
const PORT = 3000; // You can change the port if needed
const DATA_DIR = path.join(__dirname, 'data');
const RACKS_FILE = path.join(DATA_DIR, 'racks.json');
const SAMPLES_FILE = path.join(DATA_DIR, 'samples.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '10mb' })); // Increase limit if needed for large history

// Middleware to serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// --- API Endpoints ---

// GET /api/data - Load all data
app.get('/api/data', async (req, res) => {
    console.log('GET /api/data - Loading data...');
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Read files concurrently
        const [racksData, samplesData, historyData] = await Promise.all([
            readFileSafe(RACKS_FILE, '[]'),
            readFileSafe(SAMPLES_FILE, '[]'),
            readFileSafe(HISTORY_FILE, '[]')
        ]);

        res.json({
            racks: JSON.parse(racksData),
            samples: JSON.parse(samplesData),
            history: JSON.parse(historyData)
        });
        console.log('Data loaded successfully.');

    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ message: 'Error loading data from server.', error: error.message });
    }
});

// POST /api/data - Save all data
app.post('/api/data', async (req, res) => {
    console.log('POST /api/data - Saving data...');
    try {
        const { racks, samples, history } = req.body;

        if (!Array.isArray(racks) || !Array.isArray(samples) || !Array.isArray(history)) {
            return res.status(400).json({ message: 'Invalid data format. Expected racks, samples, and history arrays.' });
        }

        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Write files concurrently using atomic write pattern
        await Promise.all([
            writeFileSafe(RACKS_FILE, JSON.stringify(racks, null, 2)), // Pretty print JSON
            writeFileSafe(SAMPLES_FILE, JSON.stringify(samples, null, 2)),
            writeFileSafe(HISTORY_FILE, JSON.stringify(history, null, 2))
        ]);

        res.status(200).json({ message: 'Data saved successfully.' });
        console.log('Data saved successfully.');

    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data to server.', error: error.message });
    }
});

// --- Helper Functions ---

// Reads a file, returns default content if file doesn't exist or is empty
async function readFileSafe(filePath, defaultContent = '[]') {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        // Handle empty file case - return default content if file is empty
        return data.trim() === '' ? defaultContent : data;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`File not found: ${filePath}. Returning default content.`);
            return defaultContent; // File doesn't exist, return default
        }
        console.error(`Error reading file ${filePath}:`, error);
        throw error; // Re-throw other errors
    }
}

// Writes data to a file atomically (write to temp, then rename)
async function writeFileSafe(filePath, data) {
    const tempFilePath = `${filePath}.${Date.now()}.tmp`;
    try {
        await fs.writeFile(tempFilePath, data, 'utf8');
        await fs.rename(tempFilePath, filePath); // Atomic rename
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        // Clean up temp file if rename failed
        try {
            await fs.unlink(tempFilePath);
        } catch (cleanupError) {
            // Ignore cleanup error if original error was the problem
            if (cleanupError.code !== 'ENOENT') {
                 console.error(`Error cleaning up temp file ${tempFilePath}:`, cleanupError);
            }
        }
        throw error; // Re-throw the original error
    }
}


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`TubeRack Organizer server running at http://localhost:${PORT}`);
});