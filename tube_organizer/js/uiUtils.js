// js/uiUtils.js
const UIUtils = (() => {
    let activePage = 'racks'; // Default starting page

    function applyTheme(theme) {
        // ... (theme logic remains the same) ...
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggleBtn) themeToggleBtn.textContent = 'Toggle Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
             if (themeToggleBtn) themeToggleBtn.textContent = 'Toggle Dark Mode';
        }
        localStorage.setItem(Config.THEME_KEY, theme);
    }

    function navigateTo(pageId) {
        // --- DEBUGGING ---
        console.log(`UIUtils.navigateTo called for: ${pageId}`);
        // --- END DEBUGGING ---

        const allPages = document.querySelectorAll('.page'); // Get all page sections
        const targetPageId = `${pageId}-page`;
        const targetPage = document.getElementById(targetPageId);

        // --- DEBUGGING ---
        console.log(`UIUtils: Found ${allPages.length} elements with class 'page'.`);
        console.log(`UIUtils: Looking for target element with ID: ${targetPageId}`);
        // --- END DEBUGGING ---

        // Remove 'active' from all pages first
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        // Add 'active' to the target page if found
        if (targetPage) {
            // --- DEBUGGING ---
            console.log(`UIUtils: Found target page: ${targetPage.id}. Adding 'active' class.`);
            // --- END DEBUGGING ---
            targetPage.classList.add('active');
            activePage = pageId;
        } else {
            console.error(`UIUtils: Navigation error - Page with ID '${targetPageId}' not found.`);
            // Fallback: Activate the default 'racks' page if target is missing
            const defaultPage = document.getElementById('racks-page');
            if (defaultPage) {
                console.warn(`UIUtils: Falling back to default page 'racks-page'.`);
                defaultPage.classList.add('active');
                activePage = 'racks';
            } else {
                 console.error("UIUtils: Default page 'racks-page' also not found!");
            }
        }

        // Highlight active nav button (visual feedback)
        document.querySelectorAll('nav button').forEach(btn => {
            btn.style.fontWeight = btn.dataset.page === pageId ? 'bold' : 'normal';
        });

        // Reset sample page state if navigating away
        if (pageId !== 'samples' && typeof SampleManager !== 'undefined' && SampleManager.resetPage) {
             console.log("UIUtils: Calling SampleManager.resetPage()");
             SampleManager.resetPage();
        }
    }

    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    }

    function closeModal(modalId) {
         const modal = document.getElementById(modalId);
         if (modal) modal.style.display = 'none';
    }

    function getActivePage() {
        return activePage;
    }

    // Public interface
    return {
        applyTheme,
        navigateTo,
        showModal,
        closeModal,
        getActivePage
    };
})();