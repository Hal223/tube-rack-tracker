
# TubeRack Organizer

A simple, modern web application for organizing test tube blood samples within virtual racks. Designed to run locally without external dependencies, storing data in local JSON files via a lightweight Node.js server.

## Features

*   **Local Operation:** Runs entirely on your machine, no internet connection required after setup.
*   **Rack Management:** Create, modify (name, rows, columns), and delete virtual racks.
*   **Sample Management:**
    *   Add samples with unique IDs (barcode scanner friendly), optional comments, and location.
    *   View samples visually within a selected rack grid (with row/column labels).
    *   Remove samples.
    *   Automatic tracking of creation and modification dates.
*   **Search:** Dynamically search for samples by ID or comment across all racks. Selecting a search result navigates to the correct rack and highlights the cell.
*   **History Tracking:** Logs all creation, modification, deletion, and restoration actions for racks and samples.
*   **Restore Functionality:** Restore deleted or previously modified racks/samples from the history log (with conflict checks).
*   **Light/Dark Mode:** Toggle between themes for user preference.
*   **Persistent Storage:** Data (racks, samples, history) is saved locally in JSON files (`data/` directory) via the Node.js server.


## Basic Usage

*   **Navigation:** Use the buttons ("Rack Management", "Sample Management", "History Log") in the header to switch between pages.
*   **Rack Management:** Create new racks with custom names and dimensions. Edit or delete existing racks using the buttons on their cards.
*   **Sample Management:**
    *   Select a rack using the buttons on the left sidebar.
    *   Search for samples by ID or comment using the search bar above the grid. Click a result to jump to that sample.
    *   View the selected rack's grid layout.
    *   Click an empty cell to select it, then enter a Sample ID (and optional comment) in the sidebar and press Enter or click "Add Sample".
    *   Alternatively, enter the ID/comment and click "Add Sample (Next Available)" for auto-placement.
    *   Click an occupied cell to view its details in the sidebar.
    *   Use the "Remove Sample" button in the details view to delete the selected sample.
*   **History Log:** View a chronological record of all changes. Use the "Restore" button to revert specific deletions or modifications.
*   **Theme:** Use the "Toggle Dark/Light Mode" button in the header.



## Quick Start Guide

Follow these steps to get the application running locally.

### Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js:** Required to run the local server. LTS version (v16.x or higher recommended) is advised. Download from [nodejs.org](https://nodejs.org/).
2.  **npm:** Node Package Manager, comes bundled with Node.js. Used to install dependencies.

### 1. Get the Code

Clone the repository or download the source code ZIP file and extract it to a location on your computer.

### 2. Install Dependencies

Open your terminal or command prompt and navigate into the project directory.

```bash
npm install
```
This command reads the `package.json` file and downloads the necessary libraries (like Express) into a `node_modules` folder.


### 3. Run the Application Server

While still inside the project directory directory in your terminal run the following command:

```bash
node server.js
```

You should see output similar to this, indicating the server has started:

```
TubeRack Organizer server running at http://localhost:3000
```

*(The server will also automatically create the `data` directory and empty `racks.json`, `samples.json`, `history.json` files if they don't exist upon the first data load/save attempt.)*

### 4. Access the Application

Open your web browser and navigate to the URL shown in the terminal:

**http://localhost:3000**

The TubeRack Organizer application should load.

### 5. Stopping the Server

To stop the local server, go back to the terminal window where it's running and press `Ctrl + C`.

