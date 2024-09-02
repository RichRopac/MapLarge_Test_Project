MapLarge Test Project

**Overview**
This project is a proof-of-concept implementation designed to showcase a file and directory browsing system through a single-page web application (SPA). The primary goal is to demonstrate server-side and client-side logic, providing an end-to-end flow that operates without errors, enabling users to search, browse, upload, download, delete, move, copy, and rename files and directories.

**Project Structure**
Server-Side:
- Implemented using C# and .NET Core, providing a Web API that allows browsing, searching, uploading, downloading, deleting, moving, copying, and renaming files and directories.
- The API returns JSON responses, and the home directory is configurable via a variable in the appsettings.json file (HomeDirectory).

Client-Side:
- The SPA is developed using vanilla JavaScript and HTML.
- The UI work is done entirely client-side via JavaScript, rendering HTML dynamically.
- The project is deep-linkable, with the state of the UI kept in the URL.

**Features**

Browse Files & Folders:  
- Allows users to browse the contents of the server directory.
-The API ensures that only accessible directories and files are listed.

Search Files & Folders: 
- Users can search for files and directories within a specified path.
- The search functionality includes error handling for empty queries and unauthorized access.

Upload Files: 
- Users can upload files to the server via the browser.
- The uploaded files are stored in the specified directory within the server's home directory.

Download Files/Directories:
- Users can download individual files or entire directories.
- Directories are compressed into a ZIP file before download.

Delete Files/Directories:
- Users can delete files and directories.
- The system handles errors related to unauthorized access or non-existent files.

Move Files/Directories:
- Users can move files and directories to a new location within the server's home directory.
- The move operation also includes error handling for unauthorized access.

Copy Files/Directories:
- Users can copy files and directories to a new location within the server's home directory.
- The API handles recursive copying of directories, including all subdirectories and files.

Rename Files/Directories:
- Users can rename files and directories within the server's home directory.
- The system ensures that the new name is valid and does not conflict with existing files or directories.

**Single Page Application (SPA)**
Deep-Linkable URL Pattern:
- The application maintains the state of the UI in the URL, enabling deep linking.

Dynamic Breadcrumb Navigation:
- The breadcrumbs dynamically reflect the current path within the server's directory structure.
- A label \\MapServer01.Root\\ is used as a simulation of the server's root directory (C:\) and is displayed as a hyperlink for easy navigation back to the root directory.

User Interface:
- The UI includes a search bar, file listing, and action buttons for uploading, downloading, deleting, moving, copying, and renaming files and directories.
- The actions are represented by icons, providing a clean and user-friendly interface.

Simulation of Server Root
- The server's root directory is simulated by using the C:\ drive as the home directory (\\MapServer01.Root\\). This simulation allows the application to function as though it is interacting with a server root, providing a realistic environment for testing file and directory operations.

**Project Setup**

Prerequisites
- Visual Studio 2022 or newer
- .NET Core SDK
- Node.js and npm 

Running the Project
- Clone the Repository:
- Configure the Home Directory:
- Update the appsettings.json file with the desired path for HomeDirectory.
- Build and Run the Project:

This project demonstrates a functional end-to-end file and directory management system, showcasing server-side and client-side integration using C# and JavaScript. The implementation adheres to the project requirements, providing a robust and extensible foundation for further development and discussion during code reviews.


