// js/sampleControls.js
const SampleControls = (() => {
    // DOM Elements
    let sampleIdInput = null;
    let sampleCommentInput = null;
    let addSampleAutoBtn = null;
    let sampleDetailsContent = null;
    let removeSampleBtn = null;

    // Callbacks / References from SampleManager
    let getSelectedCellFunc = null;
    let getCurrentRackIdFunc = null;
    let addSampleHandler = null; // Function to call when "Add Sample" is pressed
    let removeSampleHandler = null; // Function to call when "Remove Sample" is pressed

    function cacheDOMElements() {
        sampleIdInput = document.getElementById('sample-id-input');
        sampleCommentInput = document.getElementById('sample-comment-input');
        addSampleAutoBtn = document.getElementById('add-sample-auto-btn');
        sampleDetailsContent = document.getElementById('sample-details-content');
        removeSampleBtn = document.getElementById('remove-sample-btn');

        if (!sampleIdInput || !sampleCommentInput || !addSampleAutoBtn || !sampleDetailsContent || !removeSampleBtn) {
            console.error("SampleControls: Failed to cache one or more control elements!");
        }
    }

    function init(options) {
        console.log("SampleControls: Initializing...");
        cacheDOMElements();

        // Store references/callbacks passed from SampleManager
        getSelectedCellFunc = options.getSelectedCell;
        getCurrentRackIdFunc = options.getCurrentRackId;
        addSampleHandler = options.onAddSample;
        removeSampleHandler = options.onRemoveSample;

        // Add event listeners
        if (addSampleAutoBtn) addSampleAutoBtn.addEventListener('click', handleAddSampleAuto);
        if (sampleIdInput) sampleIdInput.addEventListener('keypress', handleSampleIdKeyPress);
        if (removeSampleBtn) removeSampleBtn.addEventListener('click', handleRemoveSampleClick);

        reset(); // Set initial state
        console.log("SampleControls: Initialization complete.");
    }

    function enable(enabled) {
        if (!sampleIdInput || !sampleCommentInput || !addSampleAutoBtn) {
             console.warn("SampleControls.enable: Input elements not found.");
             return;
         }
         sampleIdInput.disabled = !enabled;
         sampleCommentInput.disabled = !enabled;
         addSampleAutoBtn.disabled = !enabled;
    }

    function reset() {
        enable(false); // Disable controls initially
        if (sampleIdInput) sampleIdInput.value = '';
        if (sampleCommentInput) sampleCommentInput.value = '';
        if (sampleDetailsContent) sampleDetailsContent.innerHTML = 'Select a rack, then a cell.';
        if (removeSampleBtn) {
            removeSampleBtn.style.display = 'none';
            removeSampleBtn.dataset.sampleId = '';
        }
    }

    function updateDetails(sample, locationString, selectedCellCoords) {
         if (!sampleDetailsContent || !removeSampleBtn) {
             console.error("SampleControls.updateDetails: Details/Remove button elements not found.");
             return;
         }

        if (sample) {
            // Display details of the found sample
            const { row, col } = DataStore.findSampleById(sample.id) || {}; // Get coords just in case
            sampleDetailsContent.innerHTML = `
                <strong>ID:</strong> ${sample.id}<br>
                <strong>Location:</strong> ${locationString || `Row ${row + 1}, Col ${col + 1}`}<br>
                <strong>Comment:</strong> ${sample.comment || '<em>No comment</em>'}<br>
                <strong>Created:</strong> ${new Date(sample.createdAt).toLocaleString()}<br>
                <strong>Modified:</strong> ${new Date(sample.modifiedAt).toLocaleString()}
            `;
            removeSampleBtn.style.display = 'inline-block';
            removeSampleBtn.dataset.sampleId = sample.id;
        } else if (selectedCellCoords && locationString) {
             // An empty cell is selected
             sampleDetailsContent.innerHTML = `
                <strong>Location:</strong> ${locationString} (Row ${selectedCellCoords.row + 1}, Col ${selectedCellCoords.col + 1})<br>
                <em>Empty Cell - Ready for new sample.</em>
             `;
             removeSampleBtn.style.display = 'none';
             removeSampleBtn.dataset.sampleId = '';
             if (sampleIdInput && !sampleIdInput.disabled) sampleIdInput.focus();
        } else {
            // No cell selected or no rack selected
            const rackId = typeof getCurrentRackIdFunc === 'function' ? getCurrentRackIdFunc() : null;
            sampleDetailsContent.innerHTML = rackId ? 'Select a cell to view details.' : 'Select a rack, then a cell.';
            removeSampleBtn.style.display = 'none';
            removeSampleBtn.dataset.sampleId = '';
        }
    }

    // --- Event Handlers ---

    function handleAddSampleAuto() {
        if (!sampleIdInput || !sampleCommentInput) return;
        const sampleId = sampleIdInput.value.trim();
        const comment = sampleCommentInput.value.trim();

        if (!sampleId) {
            alert("Sample ID cannot be empty.");
            if (sampleIdInput) sampleIdInput.focus();
            return;
        }

        // Call the handler provided by SampleManager
        if (typeof addSampleHandler === 'function') {
            addSampleHandler(sampleId, comment, null); // Pass null for coords to indicate auto-placement
        } else {
             console.error("SampleControls: onAddSample handler not configured.");
        }
    }

    function handleSampleIdKeyPress(event) {
         if (event.key === 'Enter') {
            event.preventDefault();
            if (!sampleIdInput || !sampleCommentInput) return;

            const sampleId = sampleIdInput.value.trim();
            const comment = sampleCommentInput.value.trim();
            const selectedCell = typeof getSelectedCellFunc === 'function' ? getSelectedCellFunc() : null;

            if (!sampleId) return; // Don't add if ID is empty on Enter

            // Call the handler provided by SampleManager, passing selected cell info
            if (typeof addSampleHandler === 'function') {
                 addSampleHandler(sampleId, comment, selectedCell); // Pass selected cell coords or null
            } else {
                 console.error("SampleControls: onAddSample handler not configured.");
            }
        }
    }

    function handleRemoveSampleClick() {
        if (!removeSampleBtn) return;
        const sampleIdToRemove = removeSampleBtn.dataset.sampleId;
        if (!sampleIdToRemove) return;

        // Call the handler provided by SampleManager
        if (typeof removeSampleHandler === 'function') {
            removeSampleHandler(sampleIdToRemove);
        } else {
             console.error("SampleControls: onRemoveSample handler not configured.");
        }
    }

    // --- Cleanup/Clear ---
    function clearInputs() {
         if (sampleIdInput) sampleIdInput.value = '';
         if (sampleCommentInput) sampleCommentInput.value = '';
         if (sampleIdInput && !sampleIdInput.disabled) sampleIdInput.focus();
    }

    // Public interface
    return {
        init,
        enable,
        reset,
        updateDetails,
        clearInputs
    };
})();