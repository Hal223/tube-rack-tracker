document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const rackListMainEl = document.getElementById('rack-list-main');
    const selectedRackViewEl = document.getElementById('selected-rack-view');
    const rackTitleEl = document.getElementById('rack-title');
    const rackGridContainerEl = document.getElementById('rack-grid-container'); // Container for scroll
    const rackGridEl = document.getElementById('rack-grid');
    const addSampleButton = document.getElementById('add-sample-button');

    // Sample Details Panel (Moved)
    const sampleDetailsEl = document.getElementById('sample-details');
    const detailSampleIdEl = document.getElementById('detail-sample-id');
    const detailRackNameEl = document.getElementById('detail-rack-name');
    const detailRowEl = document.getElementById('detail-row');
    const detailColEl = document.getElementById('detail-col');
    const detailCommentEl = document.getElementById('detail-comment');
    const detailCreatedEl = document.getElementById('detail-created');
    const detailModifiedEl = document.getElementById('detail-modified');
    const editSampleButton = document.getElementById('edit-sample-button'); // New button
    const deleteSampleButton = document.getElementById('delete-sample-button');
    const closeDetailsButton = document.getElementById('close-details-button');

    // Manage Racks Elements
    const addRackButton = document.getElementById('add-rack-button');
    const manageRackTableBodyEl = document.getElementById('manage-rack-table-body');
    const noRacksManageRowEl = document.getElementById('no-racks-manage-row');

    // History Log Elements
    const historyLogListEl = document.getElementById('history-log-list');
    const noHistoryLogMsgEl = document.getElementById('no-history-log-msg');

    // Tab Content Panes & Buttons
    const mainContentEl = document.getElementById('main-content');
    const manageRacksContentEl = document.getElementById('manage-racks-content');
    const historyContentEl = document.getElementById('history-content');
    const tabMainButton = document.getElementById('tab-main');
    const tabManageRacksButton = document.getElementById('tab-manage-racks');
    const tabHistoryButton = document.getElementById('tab-history');

    // Modals & Forms
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

    const editSampleModal = document.getElementById('edit-sample-modal'); // New Modal
    const editSampleForm = document.getElementById('edit-sample-form');
    const cancelEditSampleButton = document.getElementById('cancel-edit-sample');
    const editSampleIdInput = document.getElementById('edit-sample-id');
    const editSampleUniqueIdInput = document.getElementById('edit-sample-unique-id');
    const editSampleCommentInput = document.getElementById('edit-sample-comment');
    const editSampleIdError = document.getElementById('edit-sample-id-error');
    // Spans to display location in edit modal
    const editSampleLocationRack = document.getElementById('edit-sample-location-rack');
    const editSampleLocationRow = document.getElementById('edit-sample-location-row');
    const editSampleLocationCol = document.getElementById('edit-sample-location-col');


    // General UI
    const messageBoxEl = document.getElementById('message-box');
    const messageTextEl = document.getElementById('message-text');
    const importDataButton = document.getElementById('import-data-button');
    const exportDataButton = document.getElementById('export-data-button');
    const importFileInput = document.getElementById('import-file-input');

    // --- State ---
    let racks = [];
    let samples = [];
    let historyLog = []; // New state for the comprehensive history log
    let selectedRackId = null;
    let selectedSampleId = null; // Holds the internal ID (e.g., id_123...) of the sample being viewed/edited

    // --- Utility Functions ---
    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleString() : 'N/A';
    const escapeHtml = (unsafe) => {
         return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    const showMessage = (text, type = 'success') => {
        messageTextEl.textContent = text;
        messageBoxEl.className = `fixed bottom-4 right-4 z-50 rounded-md p-4 shadow-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        messageBoxEl.classList.remove('hidden');
        setTimeout(() => { messageBoxEl.classList.add('hidden'); }, 3500);
    };

    // --- History Logging ---
    const logHistory = (type, details, relatedId = null) => {
        const entry = {
            id: generateId(), // Give each log entry a unique ID
            timestamp: new Date().toISOString(),
            type: type, // e.g., 'rack_create', 'sample_update'
            details: details, // Text description of the event
            relatedId: relatedId // ID of the rack/sample involved, if applicable
        };
        historyLog.unshift(entry); // Add to the beginning of the log
        // Optional: Limit history log size if needed
        // if (historyLog.length > MAX_HISTORY_SIZE) { historyLog.pop(); }
        renderHistoryLog(); // Update the history view immediately
    };

    // --- Validation Functions (remain mostly the same) ---
    const isRackNameUnique = (name, rackIdToExclude = null) => !racks.some(r => r.name.toLowerCase() === name.trim().toLowerCase() && r.id !== rackIdToExclude);
    const checkDimensionChangeImpact = (rackId, newRows, newCols) => samples.filter(s => s.rackId === rackId && !s.isDeleted).some(s => s.row > newRows || s.col > newCols);
    const rackHasSamples = (rackId) => samples.some(s => s.rackId === rackId);
    const isSampleIdUnique = (uniqueId, sampleIdToExclude = null) => !samples.some(s => s.sampleUniqueId.toLowerCase() === uniqueId.trim().toLowerCase() && !s.isDeleted && s.id !== sampleIdToExclude);
    const isLocationValid = (rack, row, col) => rack && typeof rack.rows === 'number' && typeof rack.cols === 'number' && row >= 1 && row <= rack.rows && col >= 1 && col <= rack.cols;
    const isLocationOccupied = (rackId, row, col, sampleIdToExclude = null) => samples.some(s => s.rackId === rackId && s.row === row && s.col === col && !s.isDeleted && s.id !== sampleIdToExclude);

    // --- Rendering Functions ---
    const renderRackListMain = () => {
        rackListMainEl.innerHTML = '';
        if (racks.length === 0) { rackListMainEl.innerHTML = '<p class="text-gray-500 italic">No racks available...</p>'; return; }
        racks.forEach(rack => {
            const rackDiv = document.createElement('div');
            rackDiv.className = `p-3 border rounded-md cursor-pointer hover:bg-gray-200 ${rack.id === selectedRackId ? 'bg-blue-100 border-blue-300' : 'bg-white'}`;
            rackDiv.dataset.rackId = rack.id;
            rackDiv.innerHTML = `<p class="font-medium text-gray-800">${escapeHtml(rack.name)}</p><p class="text-sm text-gray-600">${rack.rows} x ${rack.cols}</p>`;
            rackDiv.addEventListener('click', () => selectRack(rack.id));
            rackListMainEl.appendChild(rackDiv);
        });
    };

    const renderManageRackList = () => {
        manageRackTableBodyEl.innerHTML = '';
        if (racks.length === 0) {
            if (noRacksManageRowEl) { manageRackTableBodyEl.appendChild(noRacksManageRowEl); noRacksManageRowEl.classList.remove('hidden'); }
            else { manageRackTableBodyEl.innerHTML = '<tr><td colspan="5" class="px-6 py-4 ...">No racks created yet.</td></tr>'; } // Added colspan="5"
            return;
        }
        if (noRacksManageRowEl) noRacksManageRowEl.classList.add('hidden');
        racks.forEach(rack => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(rack.name)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rack.rows} x ${rack.cols}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(rack.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(rack.updatedAt)}</td> 
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button data-rack-id="${rack.id}" class="edit-rack-button text-indigo-600 hover:text-indigo-900" title="Edit Rack"><i data-lucide="edit" class="h-4 w-4 inline-block"></i> Edit</button>
                    <button data-rack-id="${rack.id}" data-rack-name="${escapeHtml(rack.name)}" class="delete-rack-button text-red-600 hover:text-red-900" title="Delete Rack"><i data-lucide="trash-2" class="h-4 w-4 inline-block"></i> Delete</button>
                </td>`;
            manageRackTableBodyEl.appendChild(row);
        });
        // Add event listeners
        manageRackTableBodyEl.querySelectorAll('.edit-rack-button').forEach(b => b.addEventListener('click', (e) => openEditRackModal(e.currentTarget.dataset.rackId)));
        manageRackTableBodyEl.querySelectorAll('.delete-rack-button').forEach(b => b.addEventListener('click', (e) => deleteRack(e.currentTarget.dataset.rackId, e.currentTarget.dataset.rackName)));
        lucide.createIcons();
    };

    const renderRackGrid = () => {
        rackGridEl.innerHTML = '';
        // sampleDetailsEl.classList.add('hidden'); // Don't hide details when grid re-renders if a sample is selected
        addSampleButton.classList.add('hidden');

        if (!selectedRackId) {
            rackTitleEl.textContent = 'Select a Rack';
            rackGridEl.innerHTML = '<p class="text-gray-500 italic p-4">Select a rack from the list to view its grid.</p>';
            rackGridEl.style.gridTemplateColumns = ''; // Reset columns
            return;
        }
        const rack = racks.find(r => r.id === selectedRackId);
        if (!rack) {
            rackTitleEl.textContent = 'Rack Not Found';
            rackGridEl.innerHTML = '<p class="text-red-500 italic p-4">Error: Could not find the selected rack.</p>';
            rackGridEl.style.gridTemplateColumns = '';
            selectedRackId = null;
            return;
        }
        rackTitleEl.textContent = `Rack: ${escapeHtml(rack.name)} (${rack.rows}x${rack.cols})`;
        addSampleButton.classList.remove('hidden');
        // Set grid columns dynamically based on rack size for horizontal scroll
        rackGridEl.style.gridTemplateColumns = `repeat(${rack.cols}, minmax(60px, 1fr))`;

        const rackSamples = samples.filter(s => s.rackId === selectedRackId && !s.isDeleted);
        for (let r = 1; r <= rack.rows; r++) {
            for (let c = 1; c <= rack.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                const sampleInCell = rackSamples.find(s => s.row === r && s.col === c);
                if (sampleInCell) {
                    cell.classList.add('occupied');
                    cell.textContent = escapeHtml(sampleInCell.sampleUniqueId);
                    cell.title = `Sample: ${escapeHtml(sampleInCell.sampleUniqueId)}\nComment: ${escapeHtml(sampleInCell.comment || 'None')}`;
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering empty cell click
                        showSampleDetails(sampleInCell.id);
                    });
                } else {
                    cell.classList.add('empty');
                    cell.title = `Empty: R${r}C${c}`;
                    cell.addEventListener('click', () => { openAddSampleModal(selectedRackId, r, c); });
                }
                rackGridEl.appendChild(cell);
            }
        }
    };

    // Updated to render the new historyLog
    const renderHistoryLog = () => {
         historyLogListEl.innerHTML = ''; // Clear existing list
         if (historyLog.length === 0) {
             noHistoryLogMsgEl.classList.remove('hidden');
             return;
         }
         noHistoryLogMsgEl.classList.add('hidden');

         historyLog.forEach(entry => {
             const div = document.createElement('div');
             const entryTypeClass = entry.type.startsWith('rack_') ? 'history-entry-rack' : 'history-entry-sample';
             div.className = `history-entry ${entryTypeClass}`;
             div.innerHTML = `
                 <p class="history-timestamp">${formatDate(entry.timestamp)}</p>
                 <p class="text-sm">${escapeHtml(entry.details)}</p>
             `;

             // Add restore button specifically for sample deletion entries
             if (entry.type === 'sample_delete' && entry.relatedId) {
                 const restoreButton = document.createElement('button');
                 restoreButton.className = 'text-xs text-indigo-600 hover:text-indigo-900 mt-1';
                 restoreButton.textContent = 'Restore Sample';
                 restoreButton.onclick = () => restoreSample(entry.relatedId); // relatedId should be the sample's internal ID
                 div.appendChild(restoreButton);
             }

             historyLogListEl.appendChild(div);
         });
     };

    // --- Refresh All Views ---
    const refreshAllViews = () => {
         renderRackListMain();
         renderManageRackList();
         renderRackGrid();
         renderHistoryLog(); // Use the new history log renderer
         lucide.createIcons();
    }

    // --- Action Functions ---
    const addRack = (name, rows, cols) => {
        addRackNameError.classList.add('hidden');
        if (!name || !rows || !cols || rows < 1 || cols < 1) { showMessage('Invalid rack details.', 'error'); return; }
        if (!isRackNameUnique(name)) { addRackNameError.classList.remove('hidden'); return; }

        const now = new Date().toISOString();
        const newRack = { id: generateId(), name: name.trim(), rows: parseInt(rows, 10), cols: parseInt(cols, 10), createdAt: now, updatedAt: now };
        racks.push(newRack);
        logHistory('rack_create', `Rack "${newRack.name}" created (${newRack.rows}x${newRack.cols}).`, newRack.id);
        refreshAllViews();
        closeModal(addRackModal);
        showMessage(`Rack "${newRack.name}" created.`);
    };

    const updateRack = (rackId, newName, newRows, newCols) => {
         editRackNameError.classList.add('hidden'); editRackDimensionError.classList.add('hidden');
         const rackIndex = racks.findIndex(r => r.id === rackId);
         if (rackIndex === -1) { showMessage("Rack not found.", "error"); return false; }

         const originalRack = racks[rackIndex];
         newName = newName.trim(); newRows = parseInt(newRows, 10); newCols = parseInt(newCols, 10);
         let changes = []; // Track changes for log message

         if (!isRackNameUnique(newName, rackId)) { editRackNameError.classList.remove('hidden'); return false; }
         if (!newName || !newRows || !newCols || newRows < 1 || newCols < 1) { showMessage('Invalid details.', 'error'); return false; }
         if ((newRows < originalRack.rows || newCols < originalRack.cols) && checkDimensionChangeImpact(rackId, newRows, newCols)) { editRackDimensionError.classList.remove('hidden'); return false; }

         // Log specific changes
         if (originalRack.name !== newName) changes.push(`name to "${newName}"`);
         if (originalRack.rows !== newRows || originalRack.cols !== newCols) changes.push(`dimensions to ${newRows}x${newCols}`);

         if (changes.length > 0) {
             racks[rackIndex] = { ...originalRack, name: newName, rows: newRows, cols: newCols, updatedAt: new Date().toISOString() };
             logHistory('rack_update', `Rack "${originalRack.name}" updated: ${changes.join(', ')}.`, rackId);
             refreshAllViews();
             closeModal(editRackModal);
             showMessage(`Rack "${newName}" updated.`);
             return true;
         } else {
             closeModal(editRackModal); // Close modal even if no changes
             return false; // No changes made
         }
    };

     const deleteRack = (rackId, rackName) => {
        if (rackHasSamples(rackId)) { showMessage(`Cannot delete rack "${rackName}": contains samples.`, 'error'); return; }
        if (confirm(`Delete empty rack "${rackName}"? This cannot be undone.`)) {
            racks = racks.filter(r => r.id !== rackId);
            logHistory('rack_delete', `Rack "${rackName}" deleted.`, rackId);
            if (selectedRackId === rackId) { selectedRackId = null; } // Deselect if deleted
            refreshAllViews();
            showMessage(`Rack "${rackName}" deleted.`);
        }
    };

    const selectRack = (rackId) => {
        selectedRackId = rackId;
        selectedSampleId = null; // Clear selected sample
        sampleDetailsEl.classList.add('hidden'); // Hide details panel when rack changes
        renderRackListMain();
        renderRackGrid();
    };

     const addSample = (rackId, uniqueId, comment, row, col) => {
         const rack = racks.find(r => r.id === rackId);
         if (!rack) { showMessage('Rack not found.', 'error'); return false; }
         row = parseInt(row, 10); col = parseInt(col, 10); uniqueId = uniqueId.trim();
         sampleIdErrorEl.classList.add('hidden'); locationErrorEl.classList.add('hidden');
         if (!isSampleIdUnique(uniqueId)) { sampleIdErrorEl.textContent = `Sample ID "${uniqueId}" is in use.`; sampleIdErrorEl.classList.remove('hidden'); return false; }
         let locValid = true;
         if (!isLocationValid(rack, row, col)) { locationErrorEl.textContent = `Location R${row}C${col} out of bounds.`; locValid = false; }
         else if (isLocationOccupied(rackId, row, col)) { locationErrorEl.textContent = `Location R${row}C${col} occupied.`; locValid = false; }
         if (!locValid) { locationErrorEl.classList.remove('hidden'); return false; }

         const now = new Date().toISOString();
         const newSample = { id: generateId(), sampleUniqueId: uniqueId, comment: comment.trim() || null, rackId: rackId, row: row, col: col, createdAt: now, updatedAt: now, isDeleted: false, deletedAt: null };
         samples.push(newSample);
         logHistory('sample_create', `Sample "${uniqueId}" added to ${rack.name} at R${row}C${col}.`, newSample.id);
         renderRackGrid();
         closeModal(addSampleModal);
         showMessage(`Sample "${uniqueId}" added.`);
         return true;
    };

     // NEW Function to update sample ID and comment
    const updateSample = (sampleId, newUniqueId, newComment) => {
        editSampleIdError.classList.add('hidden');
        const sampleIndex = samples.findIndex(s => s.id === sampleId);
        if (sampleIndex === -1) {
            showMessage("Sample not found for editing.", "error");
            return false;
        }
        const originalSample = samples[sampleIndex];
        newUniqueId = newUniqueId.trim();
        newComment = newComment.trim() || null; // Store empty comment as null

        // Validate Unique ID (excluding self)
        if (!isSampleIdUnique(newUniqueId, sampleId)) {
            editSampleIdError.textContent = `Sample ID "${newUniqueId}" is already in use.`;
            editSampleIdError.classList.remove('hidden');
            return false;
        }

        let changes = [];
        if (originalSample.sampleUniqueId !== newUniqueId) changes.push(`ID changed to "${newUniqueId}"`);
        if (originalSample.comment !== newComment) changes.push(`comment updated`); // Keep log simple

        if (changes.length > 0) {
            samples[sampleIndex] = {
                ...originalSample,
                sampleUniqueId: newUniqueId,
                comment: newComment,
                updatedAt: new Date().toISOString()
            };
            logHistory('sample_update', `Sample "${originalSample.sampleUniqueId}" updated: ${changes.join(', ')}.`, sampleId);
            refreshAllViews(); // Update grid and details if visible
            showSampleDetails(sampleId); // Re-render details panel with new info
            closeModal(editSampleModal);
            showMessage(`Sample "${newUniqueId}" updated.`);
            return true;
        } else {
            closeModal(editSampleModal); // No changes, just close
            return false;
        }
    };


     const showSampleDetails = (sampleId) => {
        const sample = samples.find(s => s.id === sampleId && !s.isDeleted);
        if (!sample) { sampleDetailsEl.classList.add('hidden'); selectedSampleId = null; return; }
        const rack = racks.find(r => r.id === sample.rackId);
        selectedSampleId = sample.id; // Store internal ID

        detailSampleIdEl.textContent = escapeHtml(sample.sampleUniqueId);
        detailRackNameEl.textContent = escapeHtml(rack ? rack.name : 'Unknown');
        detailRowEl.textContent = sample.row;
        detailColEl.textContent = sample.col;
        detailCommentEl.textContent = escapeHtml(sample.comment || 'None');
        detailCreatedEl.textContent = formatDate(sample.createdAt);
        detailModifiedEl.textContent = formatDate(sample.updatedAt);
        sampleDetailsEl.classList.remove('hidden');
    };

     const deleteSample = (sampleId) => {
        const sampleIndex = samples.findIndex(s => s.id === sampleId);
        if (sampleIndex === -1 || samples[sampleIndex].isDeleted) return;
        const sample = samples[sampleIndex];
        const rack = racks.find(r => r.id === sample.rackId);

        sample.isDeleted = true;
        sample.deletedAt = new Date().toISOString();
        sample.updatedAt = sample.deletedAt;

        logHistory('sample_delete', `Sample "${sample.sampleUniqueId}" deleted from ${rack?.name || 'Unknown Rack'}.`, sampleId); // Log before clearing selection
        selectedSampleId = null;
        sampleDetailsEl.classList.add('hidden');
        renderRackGrid();
        // renderHistoryLog(); // Already called by logHistory
        showMessage(`Sample "${sample.sampleUniqueId}" deleted.`);
    };

    const restoreSample = (sampleId) => {
        const sampleIndex = samples.findIndex(s => s.id === sampleId);
        // Find original log entry if needed, but sample object has needed info
        if (sampleIndex === -1 || !samples[sampleIndex].isDeleted) { showMessage('Sample not found or not deleted.', 'error'); return; }

        const sample = samples[sampleIndex];
        const rack = racks.find(r => r.id === sample.rackId);

        if (!rack) { showMessage(`Cannot restore: Original rack (ID: ${sample.rackId}) not found.`, 'error'); return; } // Handle case where rack was deleted

        if (isLocationOccupied(sample.rackId, sample.row, sample.col)) { showMessage(`Cannot restore: Location R${sample.row}C${sample.col} in rack "${rack.name}" is now occupied.`, 'error'); return; }

        samples[sampleIndex].isDeleted = false;
        samples[sampleIndex].deletedAt = null;
        samples[sampleIndex].updatedAt = new Date().toISOString();

        logHistory('sample_restore', `Sample "${sample.sampleUniqueId}" restored to ${rack.name} at R${sample.row}C${sample.col}.`, sampleId);
        // refreshAllViews(); // logHistory calls renderHistoryLog, need to refresh grid too
         if (sample.rackId === selectedRackId) { renderRackGrid(); } // Update grid if relevant
         renderHistoryLog(); // Ensure button disappears from log
        showMessage(`Sample "${sample.sampleUniqueId}" restored.`);
    };


    // --- Import/Export Functions (Updated) ---
    const exportDataToFile = () => {
        if (racks.length === 0 && samples.length === 0 && historyLog.length === 0) { showMessage("No data to export.", "error"); return; }
        // Include historyLog in the export
        const dataToExport = { racks: racks, samples: samples, historyLog: historyLog };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const tempLink = document.createElement('a'); tempLink.href = url; tempLink.setAttribute('download', 'blood_sample_data_log.json'); tempLink.click(); // Changed filename slightly
        URL.revokeObjectURL(url); showMessage("Data exported successfully (with history).");
    };

    const importDataFromFile = (event) => {
        const file = event.target.files[0]; if (!file) { return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Validate presence of all expected arrays
                if (Array.isArray(importedData.racks) && Array.isArray(importedData.samples) && Array.isArray(importedData.historyLog)) {
                    racks = importedData.racks;
                    samples = importedData.samples;
                    historyLog = importedData.historyLog; // Load history log

                    selectedRackId = null; selectedSampleId = null;
                    sampleDetailsEl.classList.add('hidden'); // Ensure details panel is hidden after import
                    refreshAllViews();
                    showMessage("Data imported successfully (with history).");
                } else if (Array.isArray(importedData.racks) && Array.isArray(importedData.samples)) {
                     // Handle older format files gracefully (without history log)
                     racks = importedData.racks;
                     samples = importedData.samples;
                     historyLog = []; // Initialize empty history
                     logHistory('system_info', 'Imported data from older format (no history log included).');
                     selectedRackId = null; selectedSampleId = null;
                     sampleDetailsEl.classList.add('hidden');
                     refreshAllViews();
                     showMessage("Data imported successfully (older format, history reset).");
                }

                else { showMessage("Invalid file format: Missing 'racks', 'samples', or 'historyLog' array.", "error"); }
            } catch (error) { showMessage(`Error parsing file: ${error.message}`, "error"); console.error("Import error:", error); }
            finally { event.target.value = null; }
        };
        reader.onerror = (e) => { showMessage("Error reading file.", "error"); event.target.value = null; };
        reader.readAsText(file);
    };


    // --- Modal Handling ---
    const openModal = (modal) => { modal.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden')); modal.classList.add('active'); };
    const closeModal = (modal) => { modal.classList.remove('active'); const form = modal.querySelector('form'); if (form) form.reset(); modal.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden')); };

    const openAddSampleModal = (rackId, prefillRow = null, prefillCol = null) => {
        const rack = racks.find(r => r.id === rackId); if (!rack) return;
        modalRackNameEl.textContent = escapeHtml(rack.name); sampleRackIdInput.value = rackId;
        sampleRowInput.value = prefillRow || ''; sampleColInput.value = prefillCol || '';
        openModal(addSampleModal);
    };
    const openEditRackModal = (rackId) => {
        const rack = racks.find(r => r.id === rackId); if (!rack) { showMessage("Rack not found.", "error"); return; }
        editRackIdInput.value = rack.id; editRackNameInput.value = rack.name; editRackRowsInput.value = rack.rows; editRackColsInput.value = rack.cols;
        openModal(editRackModal);
    };
     // New function to open Edit Sample Modal
    const openEditSampleModal = (sampleId) => {
        const sample = samples.find(s => s.id === sampleId);
        if (!sample) { showMessage("Sample not found.", "error"); return; }
        const rack = racks.find(r => r.id === sample.rackId);

        editSampleIdInput.value = sample.id; // Store internal ID
        editSampleUniqueIdInput.value = sample.sampleUniqueId;
        editSampleCommentInput.value = sample.comment || '';
        // Display location info (read-only in this modal)
        editSampleLocationRack.textContent = escapeHtml(rack ? rack.name : 'Unknown');
        editSampleLocationRow.textContent = sample.row;
        editSampleLocationCol.textContent = sample.col;

        openModal(editSampleModal);
    };


    // --- Tab Navigation ---
    const switchTab = (targetId) => {
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.querySelector(`.tab-button[data-target='${targetId}']`).classList.add('active');
        // Refresh lists when switching to their tabs
        if (targetId === 'manage-racks-content') renderManageRackList();
        else if (targetId === 'history-content') renderHistoryLog();
        else if (targetId === 'main-content') { renderRackListMain(); renderRackGrid(); }
    };
    

    // --- Event Listeners ---
    // Add Rack
    addRackButton.addEventListener('click', () => openModal(addRackModal));
    cancelAddRackButton.addEventListener('click', () => closeModal(addRackModal));
    addRackForm.addEventListener('submit', (e) => { e.preventDefault(); addRack(addRackNameInput.value, document.getElementById('add-rack-rows').value, document.getElementById('add-rack-cols').value); });
    // Edit Rack
    cancelEditRackButton.addEventListener('click', () => closeModal(editRackModal));
    editRackForm.addEventListener('submit', (e) => { e.preventDefault(); updateRack(editRackIdInput.value, editRackNameInput.value, editRackRowsInput.value, editRackColsInput.value); });
    // Add Sample
    addSampleButton.addEventListener('click', () => { if(selectedRackId) openAddSampleModal(selectedRackId); });
    cancelAddSampleButton.addEventListener('click', () => closeModal(addSampleModal));
    addSampleForm.addEventListener('submit', (e) => { e.preventDefault(); addSample(sampleRackIdInput.value, sampleUniqueIdInput.value, sampleCommentInput.value, sampleRowInput.value, sampleColInput.value); });
    // Edit Sample
    editSampleButton.addEventListener('click', () => { if (selectedSampleId) openEditSampleModal(selectedSampleId); });
    cancelEditSampleButton.addEventListener('click', () => closeModal(editSampleModal));
    editSampleForm.addEventListener('submit', (e) => { e.preventDefault(); updateSample(editSampleIdInput.value, editSampleUniqueIdInput.value, editSampleCommentInput.value); });
    // Delete Sample
    deleteSampleButton.addEventListener('click', () => {
        if (selectedSampleId) {
             const sample = samples.find(s => s.id === selectedSampleId);
             if (confirm(`Delete sample ${sample?.sampleUniqueId || 'this sample'}?`)) { deleteSample(selectedSampleId); }
        }
    });
    closeDetailsButton.addEventListener('click', () => { sampleDetailsEl.classList.add('hidden'); selectedSampleId = null; });

    // Tabs
    tabMainButton.addEventListener('click', () => switchTab('main-content'));
    tabManageRacksButton.addEventListener('click', () => switchTab('manage-racks-content'));
    tabHistoryButton.addEventListener('click', () => switchTab('history-content'));

    // Import/Export
    exportDataButton.addEventListener('click', exportDataToFile);
    importDataButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importDataFromFile);
    // Modal Closing
    window.addEventListener('click', (event) => {
        if (event.target === addRackModal) closeModal(addRackModal);
        if (event.target === addSampleModal) closeModal(addSampleModal);
        if (event.target === editRackModal) closeModal(editRackModal);
        if (event.target === editSampleModal) closeModal(editSampleModal);
    });

    // --- Initial Load ---
    refreshAllViews();
    lucide.createIcons();
});

