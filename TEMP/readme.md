# Blood Sample Tracker

A simple web-based application to track blood samples stored in racks using HTML, CSS (Tailwind CSS), and vanilla JavaScript.

## Description

This application provides a visual interface to manage and track blood samples within defined storage racks. Key features include:

*   **Rack Management:** Create racks with custom dimensions (rows x columns).
*   **Sample Management:** Add, view, edit (ID, comment), and delete samples within racks.
*   **Visual Grid:** View the layout of selected racks, showing occupied and empty slots.
*   **Sample Details:** Click on a sample to see its ID, location, comment, and timestamps.
*   **Activity Log:** Tracks actions like rack creation/updates and sample creation/updates/deletion/restoration.
*   **Data Persistence:** Import and export all rack, sample, and history data to/from a JSON file.

## Getting Started

### Prerequisites

*   A modern web browser (e.g., Chrome, Firefox, Safari, Edge).

### Installation

1.  Clone the repository or download the `index.html`, `style.css`, and `script.js` files.
    ```bash
     git clone https://github.com/Hal223/tube-rack-tracker.git
    cd your_repository_name
    ```
2. optional (Self-hosted server)
    ```bash
    python3 -m http.server
    ```

## Usage

1.  Open the `index.html` file directly in your web browser.
2.  **Manage Racks Tab:**
    *   Click "Create New Rack" to define a rack's name and dimensions.
    *   View, edit, or delete existing racks from the table.
3.  **Racks & Samples Tab:**
    *   Select a rack from the list on the left to view its grid.
    *   Click an empty cell in the grid or the "Add Sample to this Rack" button to add a new sample.
    *   Click an occupied cell (blue) to view sample details in the panel on the left.
    *   Use the "Edit Sample" or "Delete Sample" buttons within the details panel.
4.  **Activity Log Tab:**
    *   View a chronological list of all actions performed within the application. Deleted samples can be restored from here if the location is still available.
5.  **Import/Export:**
    *   Use the "Import" button to load data from a previously exported `.json` file.
    *   Use the "Export" button to save the current state (racks, samples, history) to a `.json` file.

## Contact

Holden Prather - @Hal223 - jprather223@example.com

Project Link: https://github.com/Hal223/tube-rack-tracker
