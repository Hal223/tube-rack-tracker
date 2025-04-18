// js/sampleGrid.js
const SampleGrid = (() => {
    let gridDisplayElement = null;
    let onCellClickCallback = null;
    let currentSelectedCell = null; // Keep track of selection state visually

    function cacheDOMElements() {
        gridDisplayElement = document.getElementById('rack-display');
        if (!gridDisplayElement) {
            console.error("SampleGrid: Failed to find #rack-display element!");
        }
    }

    function init(cellClickHandler) {
        console.log("SampleGrid: Initializing...");
        cacheDOMElements();
        onCellClickCallback = cellClickHandler; // Store the callback function
        isInitialized = true; // Assuming isInitialized is managed globally or passed if needed
        console.log("SampleGrid: Initialization complete.");
    }

    // Helper function for column labels (A, B, ..., Z, AA, AB, ...)
    function getColLabel(index) {
        let label = '';
        let num = index;
        do {
            let remainder = num % 26;
            label = String.fromCharCode(65 + remainder) + label; // 65 is ASCII for 'A'
            num = Math.floor(num / 26) - 1;
        } while (num >= 0);
        return label;
    }

    function render(rack, samples, selectedCell) {
        if (!gridDisplayElement) {
            console.error("SampleGrid.render: gridDisplayElement not found.");
            return;
        }
        if (!rack || !rack.rows || !rack.cols || rack.rows <= 0 || rack.cols <= 0) {
             gridDisplayElement.innerHTML = '<p>Error: Invalid rack data for rendering.</p>';
             gridDisplayElement.style.display = ''; // Reset display
             gridDisplayElement.style.gridTemplateColumns = '';
             gridDisplayElement.style.gridTemplateRows = '';
             return;
        }

        console.log(`SampleGrid: Rendering grid for rack ${rack.id}, selected:`, selectedCell);
        currentSelectedCell = selectedCell; // Update internal state for highlighting

        // Clear previous content and styles
        gridDisplayElement.innerHTML = '';
        gridDisplayElement.style.display = 'grid'; // Ensure it's a grid

        // --- Define Sizes (Matching CSS Variables Logic) ---
        const isSmallScreen = window.innerWidth <= 768;
        const cellSize = isSmallScreen ? '40px' : '50px';
        const rowLabelWidth = isSmallScreen ? '25px' : '30px';
        const colLabelHeight = isSmallScreen ? '25px' : '30px';

        // Define grid layout for labels AND cells directly in the container
        gridDisplayElement.style.gridTemplateColumns = `${rowLabelWidth} repeat(${rack.cols}, ${cellSize})`;
        gridDisplayElement.style.gridTemplateRows = `${colLabelHeight} repeat(${rack.rows}, ${cellSize})`;

        // --- Create and Add Labels + Corner ---
        // 1. Corner
        const corner = document.createElement('div');
        corner.className = 'grid-corner';
        corner.style.gridColumn = '1';
        corner.style.gridRow = '1';
        gridDisplayElement.appendChild(corner);

        // 2. Column Labels
        for (let c = 0; c < rack.cols; c++) {
            const colLabel = document.createElement('div');
            colLabel.className = 'grid-label grid-label-col';
            colLabel.textContent = getColLabel(c);
            colLabel.style.gridColumn = `${c + 2}`; // Column index starts from 2 (after row label)
            colLabel.style.gridRow = '1'; // First row
            gridDisplayElement.appendChild(colLabel);
        }

        // 3. Row Labels
        for (let r = 0; r < rack.rows; r++) {
            const rowLabel = document.createElement('div');
            rowLabel.className = 'grid-label grid-label-row';
            rowLabel.textContent = r + 1;
            rowLabel.style.gridColumn = '1'; // First column
            rowLabel.style.gridRow = `${r + 2}`; // Row index starts from 2 (after col label)
            gridDisplayElement.appendChild(rowLabel);
        }

        // --- Populate Cells Directly into the Grid ---
        const occupiedCoords = new Set(samples.map(s => `${s.row}-${s.col}`));

        for (let r = 0; r < rack.rows; r++) {
            for (let c = 0; c < rack.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'rack-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                // Position cell in the main grid
                cell.style.gridColumn = `${c + 2}`;
                cell.style.gridRow = `${r + 2}`;

                const coord = `${r}-${c}`;
                const locationString = `${getColLabel(c)}${r + 1}`;
                cell.dataset.location = locationString;

                const sampleInCell = occupiedCoords.has(coord)
                    ? samples.find(s => s.row === r && s.col === c)
                    : null;

                if (sampleInCell) {
                    cell.classList.add('occupied');
                    cell.textContent = sampleInCell.id;
                    cell.title = `ID: ${sampleInCell.id}\nLocation: ${locationString}\nComment: ${sampleInCell.comment || 'N/A'}\nCreated: ${new Date(sampleInCell.createdAt).toLocaleString()}`;
                } else {
                    cell.title = `Empty Cell (${locationString})`;
                }

                // Apply selection highlight based on internal state
                if (currentSelectedCell && currentSelectedCell.row === r && currentSelectedCell.col === c) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', handleCellClick);
                gridDisplayElement.appendChild(cell); // Add cell directly to the main grid
            }
        }
    }

    function handleCellClick(event) {
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);

        // Update internal selection state *before* calling callback
        // This allows re-rendering with highlight immediately if needed
        currentSelectedCell = { row, col };

        // Call the callback provided by SampleManager
        if (typeof onCellClickCallback === 'function') {
            onCellClickCallback(row, col);
        } else {
            console.warn("SampleGrid: onCellClickCallback is not defined or not a function.");
        }
        // Optionally, re-render *only* highlights if performance is an issue,
        // but usually the main manager triggers a full render anyway.
        // highlightSelection(); // Example of a more granular update
    }

    // Optional: Function to update only highlights without full redraw
    function highlightSelection() {
        if (!gridDisplayElement) return;
        const cells = gridDisplayElement.querySelectorAll('.rack-cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row, 10);
            const c = parseInt(cell.dataset.col, 10);
            if (currentSelectedCell && currentSelectedCell.row === r && currentSelectedCell.col === c) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }

    function scrollCellIntoView(row, col) {
        if (!gridDisplayElement) {
            console.error("SampleGrid.scrollCellIntoView: gridDisplayElement not found.");
            return;
        }

        // Find the specific cell element using data attributes
        // Note: We query within gridDisplayElement which contains labels AND cells
        const cellSelector = `.rack-cell[data-row="${row}"][data-col="${col}"]`;
        const cellElement = gridDisplayElement.querySelector(cellSelector);

        if (cellElement) {
            console.log(`SampleGrid: Scrolling cell (${row}, ${col}) into view.`);
            // Use the standard scrollIntoView method
            cellElement.scrollIntoView({
                behavior: 'smooth', // Use smooth scrolling
                block: 'nearest',   // Scroll vertically to nearest edge
                inline: 'nearest'   // Scroll horizontally to nearest edge
            });
        } else {
            console.warn(`SampleGrid.scrollCellIntoView: Cell element not found for row ${row}, col ${col}. Selector: ${cellSelector}`);
        }
    }

    function clear() {
        if (gridDisplayElement) {
            gridDisplayElement.innerHTML = '<p>Select a rack from the left to view its grid.</p>';
            gridDisplayElement.style.display = ''; // Reset display
            gridDisplayElement.style.gridTemplateColumns = '';
            gridDisplayElement.style.gridTemplateRows = '';
        }
        currentSelectedCell = null;
    }

    // Public interface
    return {
        init,
        render,
        clear,
        getColLabel,
        scrollCellIntoView
    };
})();