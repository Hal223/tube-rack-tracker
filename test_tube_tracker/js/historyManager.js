// js/historyManager.js
const HistoryManager = (() => {
    let historyTableBody;

    function cacheDOMElements() {
        historyTableBody = document.getElementById('history-table-body');
    }

    function renderLog() {
        if (!historyTableBody) cacheDOMElements();
        const history = DataStore.getHistory();
        historyTableBody.innerHTML = ''; // Clear existing log

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="6">No changes recorded yet.</td></tr>';
            return;
        }

        history.forEach(entry => {
            const row = document.createElement('tr');
            // Restore possible if it's a DELETE or MODIFY action AND has previous state
            const canRestore = (entry.action === 'DELETE' || entry.action === 'MODIFY') && entry.previousState;

            row.innerHTML = `
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                <td>${entry.action}</td>
                <td>${entry.entityType}</td>
                <td>${entry.details || entry.entityId}</td>
                <td>${generateDetailsString(entry)}</td>
                <td>
                    ${canRestore ? `<button class="restore-btn" data-history-id="${entry.id}">Restore</button>` : 'N/A'}
                </td>
            `;
            historyTableBody.appendChild(row);
        });

        // Add event listeners for restore buttons
        historyTableBody.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', handleRestoreClick);
        });
    }

    function generateDetailsString(entry) {
        try {
            if (entry.action === 'CREATE') return `Data: ${JSON.stringify(entry.currentState)}`;
            if (entry.action === 'DELETE') return `Old Data: ${JSON.stringify(entry.previousState)}`;
            if (entry.action === 'MODIFY') return `Changes: ${getChangesString(entry.previousState, entry.currentState)}`;
            if (entry.action === 'RESTORE') return `Restored from state: ${JSON.stringify(entry.currentState)} to ${JSON.stringify(entry.previousState)}`; // Note: current/previous are swapped in logHistory for RESTORE
        } catch (e) {
            console.error("Error generating details string:", e);
            return "Error displaying details.";
        }
        return 'Details unavailable';
    }

    function getChangesString(prev, curr) {
        if (!prev || !curr) return 'N/A';
        let changes = [];
        // Check keys in current state
        for (const key in curr) {
            if (key !== 'createdAt' && key !== 'modifiedAt' && key !== 'id' && JSON.stringify(prev[key]) !== JSON.stringify(curr[key])) {
                changes.push(`${key}: '${prev[key]}' -> '${curr[key]}'`);
            }
        }
        // Check for keys only in previous state (deleted properties, less common here)
        for (const key in prev) {
             if (key !== 'createdAt' && key !== 'modifiedAt' && key !== 'id' && !(key in curr)) {
                 changes.push(`${key}: '${prev[key]}' -> (deleted)`);
             }
        }
        return changes.join(', ') || 'No significant changes detected.';
    }


    function handleRestoreClick(event) {
        const historyId = event.target.dataset.historyId;
        const entry = DataStore.getHistory().find(h => h.id === historyId); // Find from current history state

        if (!entry) {
            alert("Error: History entry not found.");
            return;
        }

        if (!confirm(`Are you sure you want to restore the state from ${new Date(entry.timestamp).toLocaleString()}? This may affect related data.`)) {
            return;
        }

        const result = DataStore.restoreEntity(entry);

        alert(result.message); // Show success or failure message

        if (result.success) {
            // Re-render affected parts of the UI
            if (typeof RackManager !== 'undefined') RackManager.renderList();
            if (typeof SampleManager !== 'undefined') {
                 SampleManager.renderRackButtons();
                 SampleManager.renderGrid(); // Re-render grid in case samples/racks changed
            }
            renderLog(); // Re-render history log itself (shows the new RESTORE entry)
        }
    }

    function init() {
        cacheDOMElements();
    }

    // Public interface
    return {
        init,
        renderLog
    };
})();