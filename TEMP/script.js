document.addEventListener('DOMContentLoaded', () => {
    const fs = require('fs'); // Node.js File System module
    const path = require('path');

    // --- DOM Elements ---
    const rackListMainEl = document.getElementById('rack-list-main');
    const selectedRackViewEl = document.getElementById('selected-rack-view');
    const rackTitleEl = document.getElementById('rack-title');
    const rackGridContainerEl = document.getElementById('rack-grid-container');
    const rackGridEl = document.getElementById('rack-grid');
    const addSampleButton = document.getElementById('add-sample-button');

    const sampleDetailsEl = document.getElementById('sample-details');
    const detailSampleIdEl = document.getElementById('detail-sample-id');
    const detailRackNameEl = document.getElementById('detail-rack-name');
    const detailRowEl = document.getElementById('detail-row');
    const detailColEl = document.getElementById('detail-col');
    const detailCommentEl = document.getElementById('detail-comment');
    const detailCreatedEl = document.getElementById('detail-created');
    const detailModifiedEl = document.getElementById('detail-modified');
    const editSampleButton = document.getElementById('edit-sample-button');
    const deleteSampleButton = document.getElementById('delete-sample-button');
    const closeDetailsButton = document.getElementById('close-details-button');

    const addRackButton = document.getElementById('add-rack-button');
    const manageRackTableBodyEl = document.getElementById('manage-rack-table-body');
    const noRacksManageRowEl = document.getElementById('no-racks-manage-row');

    const historyLogListEl = document.getElementById('history-log-list');
    const noHistoryLogMsgEl = document.getElementById('no-history-log-msg');

    const mainContentEl = document.getElementById('main-content');
    const manageRacksContentEl = document.getElementById('manage-racks-content');
    const historyContentEl = document.getElementById('history-content');
    const tabMainButton = document.getElementById('tab-main');
    const tabManageRacksButton = document.getElementById('tab-manage-racks');
    const tabHistoryButton = document.getElementById('tab-history');

    const addRackModal = document.getElementById('add-rack-modal');
    const addRackForm = document.getElementById('add-rack-form');
    const cancelAddRackButton = document.getElementById('cancel-add-rack');
    const addRackNameInput = document.getElementById('add-rack-name');
    const addRackNameError = document.getElementById('add-rack-name-error');

    const editRackModal = document.getElementById('edit-rack-modal');
    const editRackForm = document.getElementById('edit-rack-form');
    const cancelEditRackButton = document.getElementById('cancel-edit-rack');
    const editRackIdInput = document.getElementById('edit-rack-id');
    const editRackNameInput = document.getElementById('edit-rack-name');
    const editRackRowsInput = document.getElementById('edit-rack-rows');
    const editRackColsInput = document.getElementById('edit-rack-cols');
    const editRackNameError = document.getElementById('edit-rack-name-error');
    const editRackDimensionError = document.getElementById('edit-rack-dimension-error');

    const addSampleModal = document.getElementById('add-sample-modal');
    const addSampleForm = document.getElementById('add-sample-form');
    const cancelAddSampleButton = document.getElementById('cancel-add-sample');
    const modalRackNameEl = document.getElementById('modal-rack-name');
    const sampleRackIdInput = document.getElementById('sample-rack-id');
    const sampleUniqueIdInput = document.getElementById('sample-unique-id');
    const sampleRowInput = document.getElementById('sample-row');
    const sampleColInput = document.getElementById('sample-col');
    const sampleCommentInput = document.getElementById('sample-comment');
    const sampleIdErrorEl = document.getElementById('sample-id-error');
    const locationErrorEl = document.getElementById('location-error');

    const editSampleModal = document.getElementById('edit-sample-modal');
    const editSampleForm = document.getElementById('edit-sample-form');
    const cancelEditSampleButton = document.getElementById('cancel-edit-sample');
    const editSampleIdInput = document.getElementById('edit-sample-id');
    const editSampleUniqueIdInput = document.getElementById('edit-sample-unique-id');
    const editSampleCommentInput = document.getElementById('edit-sample-comment');
    const editSampleIdError = document.getElementById('edit-sample-id-error');
    const editSampleLocationRack = document.getElementById('edit-sample-location-rack');
    const editSampleLocationRow = document.getElementById('edit-sample-location-row');
    const editSampleLocationCol = document.getElementById('edit-sample-location-col');

    const messageBoxEl = document.getElementById('message-box');
    const messageTextEl = document.getElementById('message-text');
    const importDataButton = document.getElementById('import-data-button');
    const exportDataButton = document.getElementById('export-data-button');
    const importFileInput = document.getElementById('import-file-input');

    // --- State ---
    let racks = [];
    let samples = [];
    let historyLog = [];
    let selectedRackId = null;
    let selectedSampleId = null;

    // --- Utility Functions ---
    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleString() : 'N/A';
    const escapeHtml = (unsafe) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    const showMessage = (text, type = 'success') => {
        messageTextEl.textContent = text;
        messageBoxEl.className = `fixed bottom-4 right-4 z-50 rounded-md p-4 shadow-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        messageBoxEl.classList.remove('hidden');
        setTimeout(() => { messageBoxEl.classList.add('hidden'); }, 3500);
    };


    // --- Auto-Save to LocalStorage ---
    const autoSaveToLocalStorage = () => {
        const dataToSave = { racks, samples, historyLog };
        localStorage.setItem('tubeRackTrackerData', JSON.stringify(dataToSave));
        console.log('Data auto-saved to localStorage');
    };

    // --- Auto-Load from LocalStorage ---
    const autoLoadFromLocalStorage = () => {
        const savedData = localStorage.getItem('tubeRackTrackerData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData.racks) && Array.isArray(parsedData.samples) && Array.isArray(parsedData.historyLog)) {
                racks = parsedData.racks;
                samples = parsedData.samples;
                historyLog = parsedData.historyLog;
                console.log('Data auto-loaded from localStorage');
            } else {
                console.error('Invalid data format in localStorage');
            }
        } else {
            console.warn('No data found in localStorage');
        }
    };

    // --- Modify Functions to Trigger Auto-Save ---
    const logHistory = (type, details, relatedId = null) => {
        const entry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type,
            details,
            relatedId
        };
        historyLog.unshift(entry);
        autoSaveToLocalStorage();
    };

    const addRack = (name, rows, cols) => {
        const newRack = { id: generateId(), name, rows, cols };
        racks.push(newRack);
        autoSaveToLocalStorage();
    };

    const updateRack = (rackId, newName, newRows, newCols) => {
        const rack = racks.find(r => r.id === rackId);
        if (rack) {
            rack.name = newName;
            rack.rows = newRows;
            rack.cols = newCols;
            autoSaveToLocalStorage();
        }
    };

    const deleteRack = (rackId) => {
        racks = racks.filter(r => r.id !== rackId);
        autoSaveToLocalStorage();
    };

    const addSample = (rackId, uniqueId, comment, row, col) => {
        const newSample = { id: generateId(), rackId, uniqueId, comment, row, col };
        samples.push(newSample);
        autoSaveToLocalStorage();
    };

    const updateSample = (sampleId, newUniqueId, newComment) => {
        const sample = samples.find(s => s.id === sampleId);
        if (sample) {
            sample.uniqueId = newUniqueId;
            sample.comment = newComment;
            autoSaveToLocalStorage();
        }
    };

    const deleteSample = (sampleId) => {
        samples = samples.filter(s => s.id !== sampleId);
        autoSaveToLocalStorage();
    };

    const restoreSample = (sampleId) => {
        // Restore logic here...
        autoSaveToLocalStorage();
    };

    // --- Initial Load ---
    autoLoadFromLocalStorage();
    refreshAllViews();
});
    // --- Auto-Export to Database Folder ---
    const autoExportToDatabase = () => {
        const databaseFolder = path.join(__dirname, 'database');

        if (!fs.existsSync(databaseFolder)) {
            fs.mkdirSync(databaseFolder);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(databaseFolder, `data_${timestamp}.json`);

        const dataToExport = { racks, samples, historyLog };
        fs.writeFileSync(filePath, JSON.stringify(dataToExport, null, 2));
        console.log(`Data auto-exported to ${filePath}`);
    };

    // --- Auto-Load Most Recent JSON ---
    const autoLoadFromDatabase = () => {
        const databaseFolder = path.join(__dirname, 'database');

        if (!fs.existsSync(databaseFolder)) {
            console.warn('Database folder does not exist. No data to load.');
            return;
        }

        const files = fs.readdirSync(databaseFolder)
            .filter(file => file.endsWith('.json'))
            .map(file => ({ file, time: fs.statSync(path.join(databaseFolder, file)).mtime }))
            .sort((a, b) => b.time - a.time);

        if (files.length === 0) {
            console.warn('No JSON files found in the database folder.');
            return;
        }

        const mostRecentFile = path.join(databaseFolder, files[0].file);
        const importedData = JSON.parse(fs.readFileSync(mostRecentFile, 'utf-8'));

        if (Array.isArray(importedData.racks) && Array.isArray(importedData.samples) && Array.isArray(importedData.historyLog)) {
            racks = importedData.racks;
            samples = importedData.samples;
            historyLog = importedData.historyLog;
            console.log(`Data auto-loaded from ${mostRecentFile}`);
        } else {
            console.error('Invalid data format in the most recent JSON file.');
        }
    };

    // --- Modify Functions to Trigger Auto-Export ---
    const logHistory = (type, details, relatedId = null) => {
        const entry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type,
            details,
            relatedId
        };
        historyLog.unshift(entry);
        renderHistoryLog();
        autoExportToDatabase();
    };

    const addRack = (name, rows, cols) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const updateRack = (rackId, newName, newRows, newCols) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const deleteRack = (rackId, rackName) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const addSample = (rackId, uniqueId, comment, row, col) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const updateSample = (sampleId, newUniqueId, newComment) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const deleteSample = (sampleId) => {
        // ...existing code...
        autoExportToDatabase();
    };

    const restoreSample = (sampleId) => {
        // ...existing code...
        autoExportToDatabase();
    };

    // --- Initial Load ---
    autoLoadFromDatabase();
    refreshAllViews();
    lucide.createIcons();
});