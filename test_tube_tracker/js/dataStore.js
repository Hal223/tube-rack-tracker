// js/dataStore.js
const DataStore = (() => {
    let racks = [];
    let samples = [];
    let history = [];
    let isLoading = false;
    let isSaving = false;
    let saveQueued = false;

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    function getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // --- API Communication ---

    async function load() {
        if (isLoading) {
            console.log("Load already in progress.");
            return; // Prevent concurrent loads
        }
        isLoading = true;
        console.log("DataStore: Initiating data load from server...");
        try {
            const response = await fetch('/api/data');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                throw new Error(`HTTP error ${response.status}: ${errorData.message || 'Unknown server error'}`);
            }
            const data = await response.json();
            racks = data.racks || [];
            samples = data.samples || [];
            history = data.history || [];
            console.log("DataStore: Data loaded successfully:", { racks: racks.length, samples: samples.length, history: history.length });
        } catch (error) {
            console.error("DataStore: Error loading data:", error);
            alert(`Failed to load data from server: ${error.message}\n\nPlease ensure the server is running and check the console for details.\nUsing empty data.`);
            // Initialize with empty arrays on failure to prevent app crash
            racks = [];
            samples = [];
            history = [];
        } finally {
            isLoading = false;
        }
    }

    // Debounced or throttled save could be implemented here if needed,
    // but for simplicity, we'll save immediately but prevent concurrent saves.
    async function save() {
        if (isSaving) {
            console.log("DataStore: Save already in progress, queuing next save.");
            saveQueued = true; // Mark that a save is needed after the current one finishes
            return;
        }

        isSaving = true;
        saveQueued = false; // Reset queue flag for this save attempt
        console.log("DataStore: Initiating data save to server...");

        // Create copies of the data to save, ensuring no mutations during async op
        const dataToSave = {
            racks: [...racks],
            samples: [...samples],
            history: [...history]
        };

        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                throw new Error(`HTTP error ${response.status}: ${errorData.message || 'Unknown server error'}`);
            }
            const result = await response.json();
            console.log("DataStore: Data saved successfully.", result.message);

        } catch (error) {
            console.error("DataStore: Error saving data:", error);
            alert(`Failed to save data to server: ${error.message}\n\nChanges might be lost. Check server status and console.`);
            // Optionally: Implement retry logic or notify user more persistently
        } finally {
            isSaving = false;
            // If another save was requested while this one was running, trigger it now
            if (saveQueued) {
                console.log("DataStore: Processing queued save request.");
                save(); // Trigger the queued save
            }
        }
    }

    function logHistory(action, entityType, entityId, details = '', previousState = null, currentState = null) {
        const logEntry = {
            id: generateId(),
            timestamp: getCurrentTimestamp(),
            action,
            entityType,
            entityId,
            details,
            previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
            currentState: currentState ? JSON.parse(JSON.stringify(currentState)) : null
        };
        history.unshift(logEntry);
        save(); // Save immediately after logging
        // Notify history manager to update view
        if (typeof HistoryManager !== 'undefined' && HistoryManager.renderLog) {
             HistoryManager.renderLog();
        }
    }

    // --- Getters (remain the same) ---
    const getRacks = () => [...racks];
    const getSamples = () => [...samples];
    const getHistory = () => [...history];
    const findRackById = (id) => racks.find(r => r.id === id);
    const findSampleById = (id) => samples.find(s => s.id === id);
    const findSamplesByRack = (rackId) => samples.filter(s => s.rackId === rackId);
    const findSampleByLocation = (rackId, row, col) => samples.find(s => s.rackId === rackId && s.row === row && s.col === col);

    // --- Setters/Modifiers (add 'save()' call after modification) ---
    function addRack(rackData) {
        const newRack = {
            ...rackData,
            id: generateId(),
            createdAt: getCurrentTimestamp(),
            modifiedAt: getCurrentTimestamp()
        };
        racks.push(newRack);
        logHistory('CREATE', 'RACK', newRack.id, `Rack created: ${newRack.name}`, null, newRack);
        // save(); // logHistory already calls save
        return newRack;
    }

    function updateRack(id, updatedData) {
        const index = racks.findIndex(r => r.id === id);
        if (index > -1) {
            const oldRack = { ...racks[index] };
            racks[index] = { ...oldRack, ...updatedData, modifiedAt: getCurrentTimestamp() };
            logHistory('MODIFY', 'RACK', id, `Rack modified: ${racks[index].name}`, oldRack, racks[index]);
            // save(); // logHistory already calls save
            return racks[index];
        }
        return null;
    }

    function deleteRack(id) {
        const index = racks.findIndex(r => r.id === id);
        if (index > -1) {
            const deletedRack = racks.splice(index, 1)[0];
            const samplesToDelete = samples.filter(s => s.rackId === id);
            const initialSampleCount = samples.length;
            samples = samples.filter(s => s.rackId !== id); // Update main samples array

            // Log sample deletions first
            samplesToDelete.forEach(sample => {
                 logHistory('DELETE', 'SAMPLE', sample.id, `Sample deleted due to rack deletion (Rack: ${deletedRack.name})`, sample, null);
            });
            // Log rack deletion
            logHistory('DELETE', 'RACK', id, `Rack deleted: ${deletedRack.name}`, deletedRack, null);

            // Only call save once if changes were made (samples deleted or rack deleted)
            // logHistory calls save internally, so an explicit save here might be redundant
            // unless logHistory fails or is bypassed. Let's rely on logHistory's save.
            // if (samples.length !== initialSampleCount || deletedRack) {
            //     save();
            // }
            return deletedRack;
        }
        return null;
    }

     function deleteSamples(sampleIds) {
        let deletedCount = 0;
        const remainingSamples = [];
        const deletedSamplesLog = [];

        samples.forEach(sample => {
            if (sampleIds.includes(sample.id)) {
                deletedSamplesLog.push({ ...sample });
                deletedCount++;
            } else {
                remainingSamples.push(sample);
            }
        });

        if (deletedCount > 0) {
            samples = remainingSamples;
            deletedSamplesLog.forEach(deletedSample => {
                 logHistory('DELETE', 'SAMPLE', deletedSample.id, `Sample removed (potentially due to rack resize)`, deletedSample, null);
            });
            // save(); // logHistory calls save
        }
        return deletedCount;
    }


    function addSample(sampleData) {
        if (samples.some(s => s.id === sampleData.id)) {
            console.error(`Sample ID ${sampleData.id} already exists.`);
            return null;
        }
        if (findSampleByLocation(sampleData.rackId, sampleData.row, sampleData.col)) {
             console.error(`Cell (${sampleData.row}, ${sampleData.col}) is already occupied.`);
             return null;
        }

        const newSample = {
            ...sampleData,
            createdAt: getCurrentTimestamp(),
            modifiedAt: getCurrentTimestamp()
        };
        samples.push(newSample);
        const rackName = findRackById(newSample.rackId)?.name || 'N/A';
        logHistory('CREATE', 'SAMPLE', newSample.id, `Sample added to Rack ${rackName} at (${newSample.row+1}, ${newSample.col+1})`, null, newSample);
        // save(); // logHistory calls save
        return newSample;
    }

    function deleteSample(id) {
        const index = samples.findIndex(s => s.id === id);
        if (index > -1) {
            const deletedSample = samples.splice(index, 1)[0];
            const rackName = findRackById(deletedSample.rackId)?.name || 'N/A';
            logHistory('DELETE', 'SAMPLE', id, `Sample removed from Rack ${rackName} at (${deletedSample.row+1}, ${deletedSample.col+1})`, deletedSample, null);
            // save(); // logHistory calls save
            return deletedSample;
        }
        return null;
    }

    // --- Restore Functions (add 'save()' call after successful restore) ---
    function restoreEntity(entry) {
        // ... (restore logic remains the same as before) ...
        if (!entry || !entry.previousState) return { success: false, message: "Missing previous state." };

        const { entityType, entityId, previousState, action } = entry;
        let restoreActionDescription = '';
        let success = false;

        try {
            if (entityType === 'RACK') {
                const rackExists = racks.some(r => r.id === entityId);
                if (action === 'DELETE') {
                    if (rackExists) return { success: false, message: `Rack ID ${entityId} already exists.` };
                    racks.push({ ...previousState });
                    restoreActionDescription = `Restored deleted rack: ${previousState.name}`;
                    success = true;
                } else if (action === 'MODIFY') {
                    const index = racks.findIndex(r => r.id === entityId);
                    if (index === -1) return { success: false, message: `Rack ID ${entityId} not found for restore.` };
                    racks[index] = { ...previousState };
                    restoreActionDescription = `Restored modified rack: ${previousState.name}`;
                    success = true;
                }
            } else if (entityType === 'SAMPLE') {
                 const sampleExists = samples.some(s => s.id === entityId);
                 if (action === 'DELETE') {
                    if (sampleExists) return { success: false, message: `Sample ID ${entityId} already exists.` };
                    const rack = findRackById(previousState.rackId);
                    if (!rack) return { success: false, message: `Original rack ${previousState.rackId} not found.` };
                    if (previousState.row >= rack.rows || previousState.col >= rack.cols) return { success: false, message: `Original cell (${previousState.row+1}, ${previousState.col+1}) out of bounds.` };
                    if (findSampleByLocation(previousState.rackId, previousState.row, previousState.col)) return { success: false, message: `Original cell (${previousState.row+1}, ${previousState.col+1}) is occupied.` };

                    samples.push({ ...previousState });
                    restoreActionDescription = `Restored deleted sample: ${entityId}`;
                    success = true;
                 } else if (action === 'MODIFY') {
                    const index = samples.findIndex(s => s.id === entityId);
                    if (index === -1) return { success: false, message: `Sample ID ${entityId} not found for restore.` };
                    samples[index] = { ...previousState };
                    restoreActionDescription = `Restored modified sample: ${entityId}`;
                    success = true;
                 }
            }

            if (success) {
                // Log the restore action itself, which will trigger a save
                logHistory('RESTORE', entityType, entityId, restoreActionDescription, entry.currentState, entry.previousState);
                // save(); // No need - logHistory calls save
                return { success: true, message: "Restore successful!" };
            } else {
                return { success: false, message: "Restore action/type not supported." };
            }
        } catch (error) {
             console.error("Restore error:", error);
             return { success: false, message: `Error during restore: ${error.message}` };
        }
    }


    // Public interface
    return {
        load, // Expose load to be called on startup
        // save, // Generally don't expose save directly, rely on internal calls
        logHistory, // Expose for explicit logging if needed elsewhere (unlikely)
        generateId,
        getCurrentTimestamp,
        getRacks,
        getSamples,
        getHistory,
        findRackById,
        findSampleById,
        findSamplesByRack,
        findSampleByLocation,
        addRack,
        updateRack,
        deleteRack,
        deleteSamples,
        addSample,
        deleteSample,
        restoreEntity
    };
})();