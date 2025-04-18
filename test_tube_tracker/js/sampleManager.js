// js/sampleManager.js
const SampleManager = (() => {
    // DOM Elements
    let rackSelectionButtons = null;
    let sampleSearchInput = null; // New
    let sampleSearchResults = null; // New

    // State
    let currentRackId = null;
    let selectedCell = null; // { row, col }
    let isInitialized = false;
    let searchDebounceTimer = null; // For debouncing search input

    function cacheDOMElements() {
        console.log("SampleManager: Caching DOM elements...");
        rackSelectionButtons = document.getElementById('rack-selection-buttons');
        sampleSearchInput = document.getElementById('sample-search-input'); // New
        sampleSearchResults = document.getElementById('sample-search-results'); // New

        if (!rackSelectionButtons) console.error("SampleManager: Failed to find #rack-selection-buttons element!");
        if (!sampleSearchInput) console.error("SampleManager: Failed to find #sample-search-input element!");
        if (!sampleSearchResults) console.error("SampleManager: Failed to find #sample-search-results element!");
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

        // Add Search Event Listener
        if (sampleSearchInput) {
            sampleSearchInput.addEventListener('input', handleSearchInput);
            // Optional: Clear results when input loses focus and isn't hovered over results
            // sampleSearchInput.addEventListener('blur', handleSearchBlur);
        }

        isInitialized = true;
        resetPage();
        console.log("SampleManager: Initialization complete.");
    }

    // --- Rack Selection ---
    function renderRackButtons() {
        // ... (logic remains the same) ...
        ensureElementsCached();
        if (!rackSelectionButtons) { console.error("SM renderRackButtons: Buttons container not found."); return; }
        const racks = DataStore.getRacks();
        rackSelectionButtons.innerHTML = '';
        if (racks.length === 0) { rackSelectionButtons.innerHTML = '<p>No racks available.</p>'; return; }
        racks.forEach(rack => { /* ... create and append buttons ... */
            const button = document.createElement('button');
            button.className = 'rack-select-btn';
            button.textContent = `${rack.name} (${rack.rows}x${rack.cols})`;
            button.dataset.rackId = rack.id;
            if (rack.id === currentRackId) button.classList.add('active');
            button.addEventListener('click', handleRackButtonClick);
            rackSelectionButtons.appendChild(button);
        });
    }

    function handleRackButtonClick(event) {
        // ... (logic remains the same) ...
        const clickedRackId = event.currentTarget.dataset.rackId;
        if (clickedRackId !== currentRackId) {
            console.log(`SampleManager: Rack selected via button - ${clickedRackId}`);
            switchRack(clickedRackId); // Use helper function
        }
    }

    // --- Search Logic ---
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        // Debounce: Wait 300ms after user stops typing
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            if (query.length >= 1) { // Search on 1 or more characters
                console.log(`SampleManager: Performing search for "${query}"`);
                performSearch(query);
            } else {
                clearSearchResults();
            }
        }, 300); // 300ms delay
    }

    function performSearch(query) {
        const lowerQuery = query.toLowerCase();
        const allSamples = DataStore.getSamples();

        // --- MODIFIED FILTER LOGIC ---
        const matches = allSamples.filter(sample => {
            const idMatch = sample.id.toLowerCase().includes(lowerQuery);
            // Check comment only if it exists and is not null/empty
            const commentMatch = sample.comment && sample.comment.toLowerCase().includes(lowerQuery);
            return idMatch || commentMatch; // Return true if ID OR Comment matches
        }).slice(0, 15); // Increased limit slightly, adjust as needed
        // --- END MODIFIED FILTER LOGIC ---

        console.log(`SampleManager: Search found ${matches.length} matches for "${query}" (showing top 15).`);
        renderSearchResults(matches);
    }

    function renderSearchResults(matches) {
        // ... (renderSearchResults logic remains the same) ...
        ensureElementsCached();
        if (!sampleSearchResults) { console.error("SM renderSearchResults: Results container not found."); return; }

        sampleSearchResults.innerHTML = ''; // Clear previous results

        if (matches.length === 0) {
            // Optional: Show "No results" message
            return; // Keep list hidden if empty
        }

        matches.forEach(sample => {
            const rack = DataStore.findRackById(sample.rackId);
            const locationString = SampleGrid.getColLabel(sample.col) + (sample.row + 1);

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.dataset.sampleId = sample.id;
            item.dataset.rackId = sample.rackId;
            item.dataset.row = sample.row;
            item.dataset.col = sample.col;

            // Display comment snippet in results if it matched (or just always show it)
            let commentSnippet = '';
            if (sample.comment) {
                 // Simple snippet - could be improved to show context of match
                 commentSnippet = sample.comment.length > 30 ? sample.comment.substring(0, 27) + '...' : sample.comment;
                 commentSnippet = ` | Comment: ${commentSnippet}`; // Add separator
            }


            item.innerHTML = `
                <strong>${sample.id}</strong>
                <small>Rack: ${rack ? rack.name : 'N/A'} | Loc: ${locationString}${commentSnippet}</small>
            `;

            item.addEventListener('click', handleSearchResultClick);
            sampleSearchResults.appendChild(item);
        });
    }
    function handleSearchResultClick(event) {
        const item = event.currentTarget;
        const targetRackId = item.dataset.rackId;
        const targetRow = parseInt(item.dataset.row, 10);
        const targetCol = parseInt(item.dataset.col, 10);
        const targetSampleId = item.dataset.sampleId;

        console.log(`SampleManager: Search result clicked - Sample: ${targetSampleId}, Rack: ${targetRackId}, Row: ${targetRow}, Col: ${targetCol}`);

        if (isNaN(targetRow) || isNaN(targetCol) || !targetRackId) {
            console.error("SampleManager: Invalid data on search result item.", item.dataset);
            return;
        }

        // --- MODIFICATION START ---

        // 1. Switch Rack and Select Cell (updates state and triggers re-render)
        // Pass the cell coordinates directly to switchRack
        switchRack(targetRackId, { row: targetRow, col: targetCol });

        // 2. Ensure the newly selected cell is scrolled into view
        // We need a slight delay to ensure the grid has rendered after switchRack
        setTimeout(() => {
            if (typeof SampleGrid.scrollCellIntoView === 'function') {
                SampleGrid.scrollCellIntoView(targetRow, targetCol);
            } else {
                console.warn("SampleManager: SampleGrid.scrollCellIntoView function not found.");
            }
        }, 100); // Small delay (e.g., 100ms) - adjust if needed

        // 3. Clear search and results
        clearSearch();

        // --- MODIFICATION END ---
    }


    function clearSearchResults() {
        if (sampleSearchResults) {
            sampleSearchResults.innerHTML = '';
        }
    }

    function clearSearch() {
         if (sampleSearchInput) {
             sampleSearchInput.value = '';
         }
         clearSearchResults();
    }

    // --- Grid Interaction ---
    function handleCellSelected(row, col) {
        // ... (logic remains the same) ...
        console.log(`SampleManager: Cell selected via grid click - Row ${row}, Col ${col}`);
        selectedCell = { row, col };
        const sample = DataStore.findSampleByLocation(currentRackId, row, col);
        const locationString = SampleGrid.getColLabel(col) + (row + 1);
        SampleControls.updateDetails(sample, locationString, selectedCell);
        renderCurrentGrid(); // Re-render to ensure highlight is correct
    }

    // --- Sample Actions (Add/Remove) ---
    function handleAddSampleRequest(sampleId, comment, targetCell) {
        // ... (logic remains the same) ...
        if (!currentRackId) { alert("Please select a rack first."); return; }
        let cellToAdd = targetCell;
        console.log(`SM handleAddSampleRequest: ID: ${sampleId}, TargetCell:`, targetCell);
        if (cellToAdd) {
            const existingSample = DataStore.findSampleByLocation(currentRackId, cellToAdd.row, cellToAdd.col);
            if (existingSample) {
                console.log("SM: Target cell occupied, trying auto-placement.");
                cellToAdd = findNextAvailableCell();
                if (!cellToAdd) { alert("Rack is full and selected cell is occupied."); return; }
            }
        } else {
            console.log("SM: Auto-placement requested.");
            cellToAdd = findNextAvailableCell();
            if (!cellToAdd) { alert("Rack is full."); return; }
        }
        console.log(`SM: Adding sample ${sampleId} to coords: Row ${cellToAdd.row}, Col ${cellToAdd.col}`);
        const result = DataStore.addSample({ id: sampleId, rackId: currentRackId, row: cellToAdd.row, col: cellToAdd.col, comment: comment || '' });
        if (result) {
            selectedCell = { row: cellToAdd.row, col: cellToAdd.col };
            renderCurrentGrid();
            SampleControls.clearInputs();
        } else {
            alert(`Failed to add sample.`);
        }
    }

    function handleRemoveSampleRequest(sampleIdToRemove) {
        // ... (logic remains the same) ...
         if (!sampleIdToRemove) return;
         console.log(`SM: Request to remove sample ${sampleIdToRemove}`);
         if (confirm(`Remove sample ID: ${sampleIdToRemove}?`)) {
            const sampleToDelete = DataStore.findSampleById(sampleIdToRemove);
            const wasSelected = selectedCell && sampleToDelete && selectedCell.row === sampleToDelete.row && selectedCell.col === sampleToDelete.col;
            const deletedSample = DataStore.deleteSample(sampleIdToRemove);
            if (deletedSample) {
                console.log(`SM: Sample ${sampleIdToRemove} removed.`);
                if (wasSelected) selectedCell = null;
                renderCurrentGrid();
                SampleControls.updateDetails(null, null, selectedCell);
            } else {
                alert("Error removing sample.");
                SampleControls.updateDetails(null, null, selectedCell);
            }
        }
    }

    // --- Helper Functions ---
    function findNextAvailableCell() {
        // ... (logic remains the same) ...
        if (!currentRackId) return null;
        const rack = DataStore.findRackById(currentRackId);
        if (!rack) return null;
        const samplesInRack = DataStore.findSamplesByRack(currentRackId);
        const occupiedCoords = new Set(samplesInRack.map(s => `${s.row}-${s.col}`));
        for (let r = 0; r < rack.rows; r++) { for (let c = 0; c < rack.cols; c++) { if (!occupiedCoords.has(`${r}-${c}`)) return { row: r, col: c }; } }
        return null;
    }

    // NEW Helper to switch rack and optionally select a cell
    function switchRack(rackId, cellToSelect = null) {
        if (!rackId) return;
        console.log(`SampleManager: Switching to rack ${rackId}, selecting cell:`, cellToSelect);
        currentRackId = rackId;
        selectedCell = cellToSelect; // Set selected cell state *before* rendering

        renderRackButtons(); // Update button highlights
        SampleControls.enable(true); // Ensure controls are enabled
        renderCurrentGrid(); // Render grid (will use new rackId and selectedCell)
        // Details are updated within renderCurrentGrid
        // Scrolling into view is handled AFTER this function completes (via setTimeout in caller)
   }

    function renderCurrentGrid() {
        // ... (logic remains the same, calls SampleGrid.render and SampleControls.updateDetails) ...
        console.log("SM renderCurrentGrid. Rack:", currentRackId, "Selected:", selectedCell);
        if (!currentRackId) { SampleGrid.clear(); SampleControls.updateDetails(null, null, null); return; }
        const rack = DataStore.findRackById(currentRackId);
        const samples = DataStore.findSamplesByRack(currentRackId);
        SampleGrid.render(rack, samples, selectedCell); // Pass selection state
        const currentSample = selectedCell ? DataStore.findSampleByLocation(currentRackId, selectedCell.row, selectedCell.col) : null;
        const locationString = selectedCell ? SampleGrid.getColLabel(selectedCell.col) + (selectedCell.row + 1) : '';
        SampleControls.updateDetails(currentSample, locationString, selectedCell);
    }

    function resetPage() {
        console.log("SampleManager: Resetting page...");
        currentRackId = null;
        selectedCell = null;
        renderRackButtons();
        SampleGrid.clear();
        SampleControls.reset();
        clearSearch(); // Clear search on full page reset
    }

    function ensureElementsCached() {
        // ... (logic remains the same) ...
        if (!isInitialized) { console.warn("SM: Caching before init."); cacheDOMElements(); }
        else if (!rackSelectionButtons || !sampleSearchInput || !sampleSearchResults) { console.warn("SM: Re-caching elements."); cacheDOMElements(); }
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