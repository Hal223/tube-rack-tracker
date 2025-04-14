// js/sampleManager.js
const SampleManager = (() => {
    // DOM Elements managed directly by SampleManager
    let rackSelectionButtons = null;

    // State
    let currentRackId = null;
    let selectedCell = null; // { row, col }
    let isInitialized = false;

    function cacheDOMElements() {
        console.log("SampleManager: Caching DOM elements...");
        rackSelectionButtons = document.getElementById('rack-selection-buttons');
        if (!rackSelectionButtons) console.error("SampleManager: Failed to find #rack-selection-buttons element!");
        console.log("SampleManager: Caching complete.");
    }

    function init() {
        if (isInitialized) return;
        console.log("SampleManager: Initializing...");
        cacheDOMElements();

        // Initialize sub-modules
        SampleGrid.init(handleCellSelected);
        SampleControls.init({
            getSelectedCell: () => selectedCell,
            getCurrentRackId: () => currentRackId,
            onAddSample: handleAddSampleRequest,
            onRemoveSample: handleRemoveSampleRequest
        });

        isInitialized = true;
        resetPage();
        console.log("SampleManager: Initialization complete.");
    }

    function renderRackButtons() {
        // ... (renderRackButtons logic remains the same) ...
        ensureElementsCached(); // Added check just in case

        if (!rackSelectionButtons) {
             console.error("SampleManager.renderRackButtons: Cannot render, rackSelectionButtons element not found.");
             return;
        }

        const racks = DataStore.getRacks();
        rackSelectionButtons.innerHTML = '';

        if (racks.length === 0) {
            rackSelectionButtons.innerHTML = '<p>No racks available. Create one first.</p>';
            return;
        }

        racks.forEach(rack => {
            const button = document.createElement('button');
            button.className = 'rack-select-btn';
            button.textContent = `${rack.name} (${rack.rows}x${rack.cols})`;
            button.dataset.rackId = rack.id;
            if (rack.id === currentRackId) {
                button.classList.add('active');
            }
            button.addEventListener('click', handleRackButtonClick);
            rackSelectionButtons.appendChild(button);
        });
    }

    function handleRackButtonClick(event) {
        // ... (handleRackButtonClick logic remains the same) ...
        const clickedButton = event.currentTarget;
        const clickedRackId = clickedButton.dataset.rackId;

        if (clickedRackId !== currentRackId) {
            console.log(`SampleManager: Rack selected - ${clickedRackId}`);
            currentRackId = clickedRackId;
            selectedCell = null; // Reset cell selection

            renderRackButtons(); // Update button highlights
            SampleControls.enable(true); // Enable input controls
            renderCurrentGrid(); // Render the grid via SampleGrid
            SampleControls.updateDetails(null, null, null); // Clear details initially
        }
    }

    // Callback function passed to SampleGrid
    function handleCellSelected(row, col) {
        console.log(`SampleManager: Cell selected - Row ${row}, Col ${col}`);
        selectedCell = { row, col };

        // Update details panel via SampleControls
        // No need to re-render grid here, just update details based on selection
        const sample = DataStore.findSampleByLocation(currentRackId, row, col);
        const locationString = SampleGrid.getColLabel(col) + (row + 1);
        SampleControls.updateDetails(sample, locationString, selectedCell);

        // Highlight the cell visually (SampleGrid can handle this)
        // We might need to trigger a grid update *if* SampleGrid doesn't handle highlights internally
        renderCurrentGrid(); // Re-render to ensure highlight is applied correctly
    }

    // Function called by SampleControls when Add is requested
    function handleAddSampleRequest(sampleId, comment, targetCell) {
        if (!currentRackId) {
            alert("Please select a rack first.");
            return;
        }

        let cellToAdd = targetCell; // Use the clicked/selected cell if provided

        // --- Debugging Log ---
        console.log(`SampleManager: handleAddSampleRequest called. ID: ${sampleId}, TargetCell:`, targetCell);
        // ---

        if (cellToAdd) { // If a specific cell was targeted
            console.log(`SampleManager: Checking occupancy for target cell: Row ${cellToAdd.row}, Col ${cellToAdd.col}`);
            const existingSample = DataStore.findSampleByLocation(currentRackId, cellToAdd.row, cellToAdd.col);
            console.log(`SampleManager: Existing sample check result:`, existingSample); // Important Log!

            if (existingSample) {
                // Cell is occupied, try auto-placement
                console.log("SampleManager: Target cell occupied, attempting auto-placement instead.");
                cellToAdd = findNextAvailableCell();
                if (!cellToAdd) {
                    alert("Rack is full and selected cell is occupied.");
                    return; // Stop if auto-placement also fails
                }
                // If auto-placement succeeds, cellToAdd is now the new empty cell coords
                console.log(`SampleManager: Auto-placement found cell: Row ${cellToAdd.row}, Col ${cellToAdd.col}`);
            }
            // If existingSample was null, cellToAdd remains the originally targeted cell
        } else {
            // Auto-placement was requested initially
            console.log("SampleManager: Auto-placement requested.");
            cellToAdd = findNextAvailableCell();
            if (!cellToAdd) {
                alert("Rack is full. Cannot add sample automatically.");
                return;
            }
            console.log(`SampleManager: Auto-placing sample at Row ${cellToAdd.row}, Col ${cellToAdd.col}`);
        }

        // Now cellToAdd holds the coordinates where we intend to add
        console.log(`SampleManager: Attempting to add sample ${sampleId} to final coords: Row ${cellToAdd.row}, Col ${cellToAdd.col}`);
        const result = DataStore.addSample({
            id: sampleId,
            rackId: currentRackId,
            row: cellToAdd.row,
            col: cellToAdd.col,
            comment: comment || ''
        });

        if (result) { // Success
            console.log(`SampleManager: Sample ${sampleId} added successfully.`);
            // Explicitly select the cell where the sample was added
            selectedCell = { row: cellToAdd.row, col: cellToAdd.col };
            renderCurrentGrid(); // Re-render grid (will show new sample & highlight)
            SampleControls.clearInputs(); // Clear input fields
            // updateDetails is handled implicitly by renderCurrentGrid calling handleCellSelected logic path
        } else {
            alert(`Failed to add sample. Check console for details (ID might exist or cell occupied).`);
        }
    }

    // Function called by SampleControls when Remove is requested
    function handleRemoveSampleRequest(sampleIdToRemove) {
         if (!sampleIdToRemove) return;
         console.log(`SampleManager: Request to remove sample ${sampleIdToRemove}`);

         if (confirm(`Are you sure you want to remove sample ID: ${sampleIdToRemove}?`)) {
            const sampleToDelete = DataStore.findSampleById(sampleIdToRemove); // Get details before deleting
            const wasSelected = selectedCell && sampleToDelete && selectedCell.row === sampleToDelete.row && selectedCell.col === sampleToDelete.col;

            const deletedSample = DataStore.deleteSample(sampleIdToRemove); // Perform deletion

            if (deletedSample) {
                console.log(`SampleManager: Sample ${sampleIdToRemove} removed successfully from DataStore.`);

                // --- Explicit State Cleanup ---
                if (wasSelected) {
                    console.log("SampleManager: Clearing selectedCell state as deleted sample was selected.");
                    selectedCell = null;
                }
                // --- End Cleanup ---

                renderCurrentGrid(); // Update grid view (will reflect deletion and cleared selection)

                // Explicitly update controls AFTER grid render, ensuring deselected state
                SampleControls.updateDetails(null, null, selectedCell);

            } else {
                alert("Error: Sample could not be removed from DataStore.");
                // Update details anyway to ensure consistency
                SampleControls.updateDetails(null, null, selectedCell);
            }
        } else {
             console.log("SampleManager: Sample removal cancelled by user.");
        }
    }

    // Helper to find next available cell
    function findNextAvailableCell() {
        // ... (findNextAvailableCell logic remains the same) ...
        if (!currentRackId) return null;
        const rack = DataStore.findRackById(currentRackId);
        if (!rack) return null;
        const samplesInRack = DataStore.findSamplesByRack(currentRackId);
        const occupiedCoords = new Set(samplesInRack.map(s => `${s.row}-${s.col}`));

        for (let r = 0; r < rack.rows; r++) {
            for (let c = 0; c < rack.cols; c++) {
                if (!occupiedCoords.has(`${r}-${c}`)) {
                    return { row: r, col: c };
                }
            }
        }
        return null; // Rack is full
    }


    function renderCurrentGrid() {
        console.log("SampleManager: renderCurrentGrid called. Current Rack:", currentRackId, "Selected Cell:", selectedCell);
        if (!currentRackId) {
            SampleGrid.clear();
            // Ensure details are also cleared if no rack is selected
            SampleControls.updateDetails(null, null, null);
            return;
        }
        const rack = DataStore.findRackById(currentRackId);
        const samples = DataStore.findSamplesByRack(currentRackId);

        // Render the grid, passing the current selection state for highlighting
        SampleGrid.render(rack, samples, selectedCell);

        // Update details panel based on the current selection state AFTER rendering grid
        // This ensures the details match the visual highlight state
        const currentSample = selectedCell ? DataStore.findSampleByLocation(currentRackId, selectedCell.row, selectedCell.col) : null;
        const locationString = selectedCell ? SampleGrid.getColLabel(selectedCell.col) + (selectedCell.row + 1) : '';
        SampleControls.updateDetails(currentSample, locationString, selectedCell);
    }

    function resetPage() {
        console.log("SampleManager: Resetting page...");
        currentRackId = null;
        selectedCell = null;
        renderRackButtons(); // Render empty/initial buttons
        SampleGrid.clear(); // Clear the grid display
        SampleControls.reset(); // Reset inputs and details display
    }

    // Ensure elements are cached before use (Helper)
    function ensureElementsCached() {
        if (!isInitialized) {
            console.warn("SampleManager: Attempted to use elements before init. Caching now.");
            cacheDOMElements();
        } else if (!rackSelectionButtons) {
            console.warn("SampleManager: rackSelectionButtons element was null after init. Re-caching.");
            cacheDOMElements();
        }
    }

    // Public interface
    return {
        init,
        renderRackButtons,
        renderCurrentGrid,
        resetPage,
        getCurrentRackId: () => currentRackId
    };
})();