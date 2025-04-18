// js/rackManager.js
const RackManager = (() => {
    // Cached DOM Elements
    let rackListDiv, rackModal, rackModalTitle, rackForm, rackIdInput, rackNameInput, rackRowsInput, rackColsInput;
    let isInitialized = false;

    function cacheDOMElements() {
        console.log("RackManager: Caching DOM elements...");
        rackListDiv = document.getElementById('rack-list');
        rackModal = document.getElementById('rack-modal');
        rackModalTitle = document.getElementById('rack-modal-title');
        rackForm = document.getElementById('rack-form');
        rackIdInput = document.getElementById('rack-id-input');
        rackNameInput = document.getElementById('rack-name');
        rackRowsInput = document.getElementById('rack-rows');
        rackColsInput = document.getElementById('rack-cols');

        if (!rackListDiv || !rackModal || !rackForm) {
            console.error("RackManager: Failed to cache essential elements (list, modal, form).");
        }
        console.log("RackManager: Caching complete.");
    }

    function ensureElementsCached() {
        if (!isInitialized) {
             console.warn("RackManager: Attempted to use elements before init. Caching now.");
             cacheDOMElements();
        } else if (!rackListDiv || !rackModal || !rackForm) {
             console.warn("RackManager: Elements were null after init. Re-caching.");
             cacheDOMElements();
        }
    }

    // --- Modal Handling ---
    function openModal(rack = null) {
        ensureElementsCached();
        if (!rackModal || !rackForm || !rackModalTitle || !rackIdInput || !rackNameInput || !rackRowsInput || !rackColsInput) {
            console.error("RackManager.openModal: Modal elements not found.");
            return;
        }
        rackForm.reset();
        if (rack) {
            rackModalTitle.textContent = 'Edit Rack';
            rackIdInput.value = rack.id;
            rackNameInput.value = rack.name;
            rackRowsInput.value = rack.rows;
            rackColsInput.value = rack.cols;
        } else {
            rackModalTitle.textContent = 'Create Rack';
            rackIdInput.value = '';
        }
        UIUtils.showModal('rack-modal');
        rackNameInput.focus();
    }

    function closeModal() {
        UIUtils.closeModal('rack-modal');
    }

    // --- Event Handlers ---
    // MOVED DEFINITIONS BEFORE renderList

    function handleEditClick(event) {
        console.log("RackManager: Edit button clicked.");
        const id = event.target.dataset.id;
        const rack = DataStore.findRackById(id);
        if (rack) {
            openModal(rack);
        } else {
            console.error(`RackManager: Rack with ID ${id} not found for editing.`);
            alert("Error: Could not find the rack to edit.");
        }
    }

    function handleDeleteClick(event) {
        console.log("RackManager: Delete button clicked.");
        const id = event.target.dataset.id;
        const rack = DataStore.findRackById(id);
        if (rack) {
            if (confirm(`Are you sure you want to delete rack "${rack.name}"? This will also delete ALL samples within it.`)) {
                console.log(`RackManager: Deleting rack ${id} (${rack.name})`);
                DataStore.deleteRack(id); // DataStore handles deleting associated samples and logging
                renderList(); // Update the list view

                // Update sample manager UI if necessary
                if (typeof SampleManager !== 'undefined') {
                    SampleManager.renderRackButtons(); // Update rack buttons list
                    // If the deleted rack was the one selected, reset the sample page
                    if (SampleManager.getCurrentRackId() === id) {
                        console.log(`RackManager: Resetting SampleManager page as current rack (${id}) was deleted.`);
                        SampleManager.resetPage();
                    }
                }
            }
        } else {
             console.error(`RackManager: Rack with ID ${id} not found for deletion.`);
             alert("Error: Could not find the rack to delete.");
        }
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        ensureElementsCached();
        if (!rackIdInput || !rackNameInput || !rackRowsInput || !rackColsInput) {
             console.error("RackManager.handleFormSubmit: Form input elements not found.");
             alert("Internal error: Cannot process rack form.");
             return;
        }

        const id = rackIdInput.value;
        const name = rackNameInput.value.trim();
        const rows = parseInt(rackRowsInput.value, 10);
        const cols = parseInt(rackColsInput.value, 10);

        if (!name || isNaN(rows) || rows < 1 || isNaN(cols) || cols < 1) {
            alert('Please provide valid name, rows, and columns.');
            return;
        }

        console.log(`RackManager: Form submitted. ID: ${id || 'New'}, Name: ${name}, Rows: ${rows}, Cols: ${cols}`);
        const currentData = { name, rows, cols };

        if (id) { // Editing
            const oldRack = DataStore.findRackById(id);
            if (!oldRack) {
                alert("Error: Rack not found for editing.");
                return;
            }

            // Check for resizing and potential sample loss
            if (rows < oldRack.rows || cols < oldRack.cols) {
                 const affectedSamples = DataStore.findSamplesByRack(id)
                     .filter(s => s.row >= rows || s.col >= cols);

                 if (affectedSamples.length > 0) {
                     if (!confirm(`Resizing this rack will remove ${affectedSamples.length} sample(s) outside the new bounds. Continue?`)) {
                         console.log("RackManager: Resizing aborted by user.");
                         return; // Abort if user cancels
                     }
                     // Delete affected samples via DataStore
                     const affectedSampleIds = affectedSamples.map(s => s.id);
                     console.log(`RackManager: Deleting ${affectedSamples.length} samples due to resize.`, affectedSampleIds);
                     DataStore.deleteSamples(affectedSampleIds); // This handles logging and saving
                 }
            }

            console.log(`RackManager: Updating rack ${id}`);
            DataStore.updateRack(id, currentData);
            // If the currently viewed rack in sample manager was edited, refresh its grid
            if (typeof SampleManager !== 'undefined' && SampleManager.getCurrentRackId() === id) {
                 console.log(`RackManager: Triggering SampleManager grid re-render for updated rack ${id}`);
                 SampleManager.renderCurrentGrid();
            }

        } else { // Creating
            console.log(`RackManager: Creating new rack ${name}`);
            DataStore.addRack(currentData);
        }

        renderList(); // Re-render rack list
        if (typeof SampleManager !== 'undefined') {
            console.log("RackManager: Triggering SampleManager button update.");
            SampleManager.renderRackButtons(); // Update dropdown on sample page
        }
        closeModal();
    }


    // --- Rendering ---
    function renderList() {
        ensureElementsCached();
        if (!rackListDiv) {
             console.error("RackManager.renderList: rackListDiv not found.");
             return;
        }

        const racks = DataStore.getRacks();
        console.log(`RackManager: Rendering list with ${racks.length} racks.`);
        rackListDiv.innerHTML = ''; // Clear existing list

        if (racks.length === 0) {
            rackListDiv.innerHTML = '<p>No racks created yet.</p>';
            return;
        }

        racks.forEach(rack => {
            const card = document.createElement('div');
            card.className = 'rack-card';
            card.innerHTML = `
                <h3>${rack.name}</h3>
                <p>Dimensions: ${rack.rows} rows x ${rack.cols} columns</p>
                <p><small>Created: ${new Date(rack.createdAt).toLocaleString()}</small></p>
                <p><small>Modified: ${new Date(rack.modifiedAt).toLocaleString()}</small></p>
                <div class="actions">
                    <button class="edit-rack-btn" data-id="${rack.id}">Edit</button>
                    <button class="delete-rack-btn" data-id="${rack.id}">Delete</button>
                </div>
            `;
            rackListDiv.appendChild(card);
        });

        // Add event listeners AFTER elements are in the DOM
        rackListDiv.querySelectorAll('.edit-rack-btn').forEach(btn => {
            // Ensure the handlers are defined in this scope
            if (typeof handleEditClick !== 'function') {
                 console.error("RackManager: handleEditClick is not defined when adding listener!");
            } else {
                 btn.addEventListener('click', handleEditClick); // Use the function defined above
            }
        });
        rackListDiv.querySelectorAll('.delete-rack-btn').forEach(btn => {
             if (typeof handleDeleteClick !== 'function') {
                 console.error("RackManager: handleDeleteClick is not defined when adding listener!");
            } else {
                btn.addEventListener('click', handleDeleteClick); // Use the function defined above
            }
        });
    }

    // --- Initialization ---
    function init() {
        if (isInitialized) return;
        console.log("RackManager: Initializing...");
        cacheDOMElements();
        isInitialized = true;

        // Add event listeners that RackManager owns
        const addBtn = document.getElementById('add-rack-btn');
        const closeBtn = rackModal?.querySelector('.close-btn'); // Use optional chaining

        if (addBtn) {
            addBtn.addEventListener('click', () => openModal());
        } else {
            console.error("RackManager: Add rack button not found.");
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        } else {
             console.error("RackManager: Modal close button not found.");
        }

        if (rackForm) {
            rackForm.addEventListener('submit', handleFormSubmit);
        } else {
             console.error("RackManager: Rack form not found.");
        }

        // Close modal if clicking outside content
        if (rackModal) {
            rackModal.addEventListener('click', (event) => {
                 if (event.target === rackModal) {
                     closeModal();
                 }
             });
        } else {
             console.error("RackManager: Rack modal not found for backdrop click listener.");
        }
        console.log("RackManager: Initialization complete.");
    }

    // Public interface
    return {
        init,
        renderList
        // No need to expose openModal, handleEditClick, etc. externally
    };
})();