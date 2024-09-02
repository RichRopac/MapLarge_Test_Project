const apiBaseUrl = "https://localhost:7146/api/Test";

// Function to show the file browser and hide the initial page
function launchFileBrowser() {
    document.getElementById("initialPage").style.display = "none";
    document.getElementById("fileBrowser").style.display = "block";
    browse();
}

// Function to close the file browser and go back to the initial page
function goBackToMainPage() {
    document.getElementById("fileBrowser").style.display = "none";
    document.getElementById("initialPage").style.display = "block";
}

// Function to exit the application
function exitApplication() {
    if (confirm("Are you sure you want to exit?")) {
        window.close(); // This may not work in all browsers
    }
}

// Function to browse directories
async function browse(path = "") {
    // Clear the search field
    document.getElementById("searchInput").value = "";

    const url = `${apiBaseUrl}/browse?path=${encodeURIComponent(path)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("You do not have access to this directory.");
            } else {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
        }
        const data = await response.json();
        displayOutput(data, path);
        updateBreadcrumbs(path);  // Update breadcrumbs with the current path
        document.getElementById("fileTable").style.display = "table";

        // Extract the current directory from the path for the search input
        const parts = path.split("/").filter(Boolean);
        const currentDirectory = parts.length > 0 ? parts[parts.length - 1] : "Root";
        const searchInput = document.getElementById("searchInput");
        searchInput.placeholder = `Search ${currentDirectory}`;
    } catch (error) {
        displayError(error);
    }
}


//Function to delete files
async function deleteItem(currentPath, itemName) {
    const url = `${apiBaseUrl}/delete?path=${encodeURIComponent(currentPath + '/' + itemName)}`;

    try {
        const response = await fetch(url, { method: 'DELETE' });
        if (response.ok) {
            alert(`${itemName} deleted successfully.`);
            browse(currentPath); // Refresh the view after deletion
        } else {
            throw new Error(`Failed to delete ${itemName}: ${response.statusText}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

 //Function to download a file or directory
function downloadItem(currentPath, itemName) {
    // Display a popup message indicating that the download has started
    alert(`Download of ${itemName} has started.`);

    // Construct the download URL
    const url = `${apiBaseUrl}/download?path=${encodeURIComponent(currentPath + '/' + itemName)}`;

    // Create a hidden link element
    const link = document.createElement('a');
    link.href = url;
    link.download = itemName;

    // Append the link to the body
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Remove the link from the DOM
    document.body.removeChild(link);
}

// Function to copy a file or directory
async function copyItem(currentPath, itemName, destinationPath) {
    try {
        const response = await fetch(`${apiBaseUrl}/copy?sourcePath=${encodeURIComponent(currentPath + '/' + itemName)}&destinationPath=${encodeURIComponent(destinationPath)}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Item copied successfully.');
            browse(currentPath); // Refresh the file browser
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        alert(`Copy failed: ${error.message}`);
    }
}


// Function to move the file or directory
async function moveItem(currentPath, itemName, destinationPath) {
    const url = `${apiBaseUrl}/move?sourcePath=${encodeURIComponent(currentPath + '/' + itemName)}&destinationPath=${encodeURIComponent(destinationPath)}`;

    try {
        const response = await fetch(url, { method: 'POST' });
        if (response.ok) {
            alert('Move successful.');
            browse(currentPath); // Refresh the current view after moving
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        alert(`Move failed: ${error.message}`);
    }
}



//Function to rename file or directory
async function renameItem(currentPath, oldName, newName) {
    const url = `${apiBaseUrl}/rename?path=${encodeURIComponent(currentPath + '/' + oldName)}&newName=${encodeURIComponent(newName)}`;

    try {
        const response = await fetch(url, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Item renamed successfully.');
            browse(currentPath);  // Refresh the file browser to show the renamed item
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        alert(`Failed to rename item: ${error.message}`);
    }
}


// Function to search for files and directories
async function search(query, currentPath = "") {
    if (query.trim() === "") {
        displayError(new Error("Please enter a search term."));
        return;
    }

    // If the currentPath is root, set it explicitly to "C:\" for clarity
    const pathForSearch = currentPath === "" ? "C:\\" : currentPath;

    const url = `${apiBaseUrl}/search?query=${encodeURIComponent(query)}&path=${encodeURIComponent(pathForSearch)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("You do not have permission to access some directories.");
            } else if (response.status === 404) {
                throw new Error("No files or directories matched your search.");
            } else {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
        }
        const data = await response.json();
        displayOutput(data, pathForSearch); // Display results within the current path
        updateBreadcrumbs(pathForSearch); // Maintain breadcrumbs for search results
        document.getElementById("fileTable").style.display = "table";
    } catch (error) {
        displayError(error);
    }
}


// Function to display the output
function displayOutput(data, currentPath) {
    const output = document.getElementById("output");
    output.innerHTML = ""; // Clear any existing rows

    data.forEach(item => {
        const row = document.createElement("tr");

        // Name cell
        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;
        if (item.type === "Directory") {
            nameCell.classList.add("directory");
            nameCell.onclick = () => {
                const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                browse(newPath);
            };
        }
        row.appendChild(nameCell);

        // Type cell
        const typeCell = document.createElement("td");
        typeCell.textContent = item.type;
        row.appendChild(typeCell);

        // Size cell
        const sizeCell = document.createElement("td");
        sizeCell.textContent = item.size !== null ? formatSize(item.size) : "N/A";
        row.appendChild(sizeCell);

        // Actions cell
        const actionsCell = document.createElement("td");

        // Delete button
        const deleteButton = document.createElement("button");
        const deleteIcon = document.createElement("img");
        deleteIcon.src = "img/icons/delete.png";
        deleteIcon.alt = "Delete";
        deleteButton.appendChild(deleteIcon);
        deleteButton.classList.add("delete-button");
        deleteButton.title = "Delete";
        actionsCell.appendChild(deleteButton);

        // Download button
        const downloadButton = document.createElement("button");
        const downloadIcon = document.createElement("img");
        downloadIcon.src = "img/icons/download.png"; // Path to your download icon
        downloadIcon.alt = "Download";
        downloadButton.appendChild(downloadIcon);
        downloadButton.classList.add("download-button");
        downloadButton.title = "Download";
        actionsCell.appendChild(downloadButton);

        // Move button
        const moveButton = document.createElement("button");
        const moveIcon = document.createElement("img");
        moveIcon.src = "img/icons/move.png"; // Path to your move icon
        moveIcon.alt = "Move";
        moveButton.appendChild(moveIcon);
        moveButton.classList.add("move-button");
        moveButton.title = "Move";
        actionsCell.appendChild(moveButton);

        // Copy button
        const copyButton = document.createElement("button");
        const copyIcon = document.createElement("img");
        copyIcon.src = "img/icons/copy.png"; // Path to your copy icon
        copyIcon.alt = "Copy";
        copyButton.appendChild(copyIcon);
        copyButton.classList.add("copy-button");
        copyButton.title = "Copy";
        actionsCell.appendChild(copyButton);

        // Rename button
        const renameButton = document.createElement("button");
        const renameIcon = document.createElement("img");
        renameIcon.src = "img/icons/rename.png"; // Path to your rename icon
        renameIcon.alt = "Rename";
        renameButton.appendChild(renameIcon);
        renameButton.classList.add("rename-button");
        renameButton.title = "Rename";
        actionsCell.appendChild(renameButton);

        // Append actions cell to the row
        row.appendChild(actionsCell);

        // Append the row to the output table
        output.appendChild(row);

        // Add event listener for the delete button
        deleteButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                deleteItem(currentPath, item.name);
            }
        });

        // Add event listener for the download button
        downloadButton.addEventListener('click', () => {
            downloadItem(currentPath, item.name);
        });

        // Add event listener for the move button
        moveButton.addEventListener('click', () => {
            const destinationPath = prompt("Enter the destination path:", currentPath);
            if (destinationPath) {
                moveItem(currentPath, item.name, destinationPath);
            }
        });

        // Add event listener for the copy button
        copyButton.addEventListener('click', () => {
            const destinationPath = prompt("Enter the destination path for copying:", currentPath);
            if (destinationPath) {
                copyItem(currentPath, item.name, destinationPath);
            }
        });

        // Add event listener for the rename button
        renameButton.addEventListener('click', () => {
            const newName = prompt("Enter the new name:", item.name);
            if (newName && newName.trim() !== "") {
                renameItem(currentPath, item.name, newName);
            } else {
                alert("Rename failed: New name cannot be empty.");
            }
        });
    });
}


// Function to display error
function displayError(error) {
    const output = document.getElementById("output");
    output.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
    document.getElementById("fileTable").style.display = "table"; // Show the table even on error
}

// Function to format the file sizes
function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}


// Function to update the breadcrumb navigation
function updateBreadcrumbs(path) {
    const breadcrumbs = document.getElementById("breadcrumbs");
    breadcrumbs.innerHTML = ""; // Clear existing breadcrumbs

    // Add the static server path label as a hyperlink
    const rootLink = document.createElement("a");
    rootLink.textContent = "\\\\MapServer01.Root\\ ";
    rootLink.href = "#";
    rootLink.onclick = (event) => {
        event.preventDefault();
        browse("");  // Call the browse function with the root path
    };
    breadcrumbs.appendChild(rootLink);

    // Remove "C:\" from the path if it exists
    const cleanPath = path.replace(/^C:\\/, "").replace(/^C:\//, "");

    if (cleanPath === "") {
        return; // If path is empty after cleaning, don't add more breadcrumbs
    }

    const parts = cleanPath.split("/").filter(Boolean);
    let fullPath = "";

    parts.forEach((part, index) => {
        if (index > 0) {
            fullPath += "/";
        }
        fullPath += part;

        const breadcrumbLink = document.createElement("a");
        breadcrumbLink.textContent = part;
        breadcrumbLink.href = "#";
        breadcrumbLink.onclick = (event) => {
            event.preventDefault();
            const subPath = parts.slice(0, index + 1).join("/");
            browse(subPath);  // Call the browse function with the subPath
        };
        breadcrumbs.appendChild(breadcrumbLink);

        if (index < parts.length - 1) {
            const separator = document.createTextNode("\\");
            breadcrumbs.appendChild(separator);
        }
    });
}


// Add event listener for the Browse button
document.getElementById('browseButton').addEventListener('click', () => {
    browse();
});

// Add event listener for the Search button
document.getElementById('searchButton').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    const currentPath = document.getElementById('breadcrumbs').innerText
        .replace("\\\\MapServer01.Root\\", "")  // Remove visual label
        .trim();

    if (searchQuery.trim() === "") {
        displayError(new Error("Please enter a search term."));
    } else {
        search(searchQuery, currentPath);
    }
});

// Add event listener for the Upload button
document.getElementById('uploadButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();  // Open the file dialog

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        const currentPath = document.getElementById('breadcrumbs').innerText.trim(); // Use trim to remove any accidental leading/trailing spaces

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${apiBaseUrl}/upload?path=${encodeURIComponent(currentPath)}`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('File uploaded successfully.');
                    browse(currentPath);  // Refresh the file browser to show the new file
                } else {
                    throw new Error(await response.text());
                }
            } catch (error) {
                alert(`File upload failed: ${error.message}`);
            }
        } else {
            alert('Please select a file to upload.');
        }
    };
});



