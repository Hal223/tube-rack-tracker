// js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Loaded. Initializing application...");

    const themeToggleBtn = document.getElementById('theme-toggle');
    // Ensure pageButtons are selected *after* HTML injection if they are part of it
    // However, in our case, <nav> is static, so selecting early is fine.
    const pageButtons = document.querySelectorAll('nav button');
    const mainContent = document.querySelector('main');

    if (mainContent) mainContent.innerHTML = '<h2>Loading data...</h2>';
    else { console.error("Fatal: <main> element not found."); return; }

    await DataStore.load();

    // Inject Page Structure
    if (mainContent) {
        // --- PASTE THE CORRECT FULL HTML STRUCTURE FOR mainContent HERE ---
        // (Ensure sections have id="racks-page", "samples-page", "history-page" and class="page")
        mainContent.innerHTML = `
        <section id="racks-page" class="page"><h2>Rack Management</h2><button id="add-rack-btn">Create New Rack</button><div id="rack-list"></div><div id="rack-modal" class="modal"><div class="modal-content"><span class="close-btn">×</span><h3 id="rack-modal-title">Create Rack</h3><form id="rack-form"><input type="hidden" id="rack-id-input"><div><label for="rack-name">Name:</label><input type="text" id="rack-name" required></div><div><label for="rack-rows">Rows:</label><input type="number" id="rack-rows" min="1" required></div><div><label for="rack-cols">Columns:</label><input type="number" id="rack-cols" min="1" required></div><button type="submit">Save Rack</button></form></div></div></section>
        <section id="samples-page" class="page"><h2>Sample Management</h2><div class="samples-layout"><div class="samples-sidebar"><div><h3>Select Rack:</h3><div id="rack-selection-buttons" class="rack-button-list"><p>Loading racks...</p></div></div><hr><div><h3>Add Sample</h3><div id="sample-controls"><label for="sample-id-input">Sample ID (Scan Barcode):</label><input type="text" id="sample-id-input" placeholder="Scan or type ID..." disabled><label for="sample-comment-input">Comment (Optional):</label><input type="text" id="sample-comment-input" placeholder="Optional comment..." disabled><button id="add-sample-auto-btn" disabled>Add Sample (Next Available)</button><p><small>Or click an empty cell in the grid.</small></p></div></div><hr><div><h3>Sample Details</h3><div id="sample-info"><div id="sample-details-content">Select a rack, then a cell.</div><button id="remove-sample-btn" style="display: none; margin-top: 10px;">Remove Sample</button></div></div></div><div class="samples-grid-area"><div id="rack-display" class="rack-grid-container"><p>Select a rack from the left to view its grid.</p></div></div></div></section>
        <section id="history-page" class="page"><h2>Change History</h2><div id="history-log"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Type</th><th>ID/Name</th><th>Details</th><th>Restore</th></tr></thead><tbody id="history-table-body"></tbody></table></div></section>
     `;
    }

    // Initialize UI Components
    UIUtils.applyTheme(localStorage.getItem(Config.THEME_KEY) || 'light');
    RackManager.init();
    SampleManager.init();
    HistoryManager.init();

    // Initial Render
    RackManager.renderList();
    // SampleManager init calls its reset, which renders buttons
    HistoryManager.renderLog();

    // --- Setup Global Event Listeners ---
    // Theme Toggle
    themeToggleBtn?.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        UIUtils.applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Page Navigation <<< CHECK THIS SECTION CAREFULLY >>>
    if (pageButtons.length > 0) {
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageId = button.dataset.page;
                if (pageId) {
                    // --- DEBUGGING ---
                    console.log(`Navigation button clicked for page: ${pageId}`);
                    // --- END DEBUGGING ---
                    UIUtils.navigateTo(pageId); // Call the function to switch pages
                } else {
                    console.error("Navigation button missing data-page attribute:", button);
                }
            });
        });
        console.log(`Attached navigation listeners to ${pageButtons.length} buttons.`);
    } else {
        console.error("Could not find any navigation buttons ('nav button').");
    }

    // Set Initial Page
    UIUtils.navigateTo('racks');

    console.log("Application Initialized.");
});