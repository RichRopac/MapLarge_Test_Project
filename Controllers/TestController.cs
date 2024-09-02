using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;

namespace TestProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly string _homeDirectory;

        public TestController(IConfiguration configuration)
        {
            _homeDirectory = configuration["HomeDirectory"];
        }

        [HttpGet("browse")]
        public IActionResult Browse([FromQuery] string? path = null)
        {
            path = path ?? string.Empty;
            string fullPath = Path.Combine(_homeDirectory, path);

            if (!Directory.Exists(fullPath))
            {
                return NotFound("Directory does not exist.");
            }

            var result = new List<object>();

            try
            {
                var directories = Directory.GetDirectories(fullPath).Select(dir => new
                {
                    Name = Path.GetFileName(dir),
                    Type = "Directory",
                    Size = (long?)null // Directories don't have a size, so set it to null
                });

                var files = Directory.GetFiles(fullPath).Select(file => new
                {
                    Name = Path.GetFileName(file),
                    Type = "File",
                    Size = new FileInfo(file).Length
                });

                result.AddRange(directories);
                result.AddRange(files);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to access this directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok(result);
        }

        [HttpGet("search")]
        public IActionResult Search([FromQuery] string query, [FromQuery] string? path = null)
        {
            path = string.IsNullOrEmpty(path) ? @"C:\" : path;
            path = path.Replace("MapServer01.Root", "").Trim();

            string fullPath = Path.Combine(_homeDirectory, path);

            if (!Directory.Exists(fullPath))
            {
                return NotFound("Directory does not exist.");
            }

            var result = new List<object>();

            try
            {
                var directories = Directory.GetDirectories(fullPath, $"*{query}*").Select(dir => new
                {
                    Name = Path.GetFileName(dir),
                    Type = "Directory",
                    Size = (long?)null
                });

                var files = Directory.GetFiles(fullPath, $"*{query}*").Select(file => new
                {
                    Name = Path.GetFileName(file),
                    Type = "File",
                    Size = new FileInfo(file).Length
                });

                result.AddRange(directories);
                result.AddRange(files);

                if (result.Count == 0)
                {
                    return NotFound("No files or directories matched your search.");
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to search in this directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] string path)
        {
            string fullPath = Path.Combine(_homeDirectory, path);

            try
            {
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
                else if (Directory.Exists(fullPath))
                {
                    Directory.Delete(fullPath, true); // true to delete the directory and its contents
                }
                else
                {
                    return NotFound("File or directory not found.");
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to delete this file or directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok();
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromQuery] string path, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file provided.");
            }

            string fullPath = Path.Combine(_homeDirectory, path, file.FileName);

            try
            {
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to upload to this directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok(new { fileName = file.FileName, filePath = fullPath });
        }

        [HttpPost("move")]
        public IActionResult Move([FromQuery] string sourcePath, [FromQuery] string destinationPath)
        {
            try
            {
                string fullSourcePath = Path.Combine(_homeDirectory, sourcePath);
                string fullDestinationPath = Path.Combine(_homeDirectory, destinationPath);

                if (!System.IO.File.Exists(fullSourcePath) && !Directory.Exists(fullSourcePath))
                {
                    return NotFound("Source file or directory does not exist.");
                }

                if (System.IO.File.Exists(fullSourcePath))
                {
                    System.IO.File.Move(fullSourcePath, fullDestinationPath);
                }
                else if (Directory.Exists(fullSourcePath))
                {
                    Directory.Move(fullSourcePath, fullDestinationPath);
                }

                return Ok("Move successful.");
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to move this file or directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("copy")]
        public IActionResult Copy([FromQuery] string sourcePath, [FromQuery] string destinationPath)
        {
            string fullSourcePath = Path.Combine(_homeDirectory, sourcePath);
            string fullDestinationPath = Path.Combine(_homeDirectory, destinationPath);

            try
            {
                if (Directory.Exists(fullSourcePath))
                {
                    DirectoryCopy(fullSourcePath, fullDestinationPath, true);
                }
                else if (System.IO.File.Exists(fullSourcePath))
                {
                    System.IO.File.Copy(fullSourcePath, fullDestinationPath);
                }
                else
                {
                    return NotFound("Source file or directory does not exist.");
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to copy this file or directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return Ok(new { sourcePath, destinationPath });
        }

        [HttpPost("rename")]
        public IActionResult Rename([FromQuery] string path, [FromQuery] string newName)
        {
            string fullPath = Path.Combine(_homeDirectory ?? string.Empty, path ?? string.Empty);

            if (!System.IO.File.Exists(fullPath) && !Directory.Exists(fullPath))
            {
                return NotFound("File or directory does not exist.");
            }

            try
            {
                string? directoryName = Path.GetDirectoryName(fullPath);

                if (directoryName == null)
                {
                    return BadRequest("Invalid directory path.");
                }

                string newPath = Path.Combine(directoryName, newName);

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Move(fullPath, newPath);
                }
                else if (Directory.Exists(fullPath))
                {
                    Directory.Move(fullPath, newPath);
                }

                return Ok(new { oldPath = path, newPath = newName });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to rename this file or directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("download")]
        public IActionResult Download([FromQuery] string path)
        {
            string fullPath = Path.Combine(_homeDirectory, path);

            try
            {
                if (System.IO.File.Exists(fullPath))
                {
                    var fileBytes = System.IO.File.ReadAllBytes(fullPath);
                    return File(fileBytes, "application/octet-stream", Path.GetFileName(fullPath));
                }
                else if (Directory.Exists(fullPath))
                {
                    string zipPath = Path.Combine(Path.GetTempPath(), Path.GetFileName(fullPath) + ".zip");

                    if (System.IO.File.Exists(zipPath))
                    {
                        System.IO.File.Delete(zipPath);
                    }

                    ZipFile.CreateFromDirectory(fullPath, zipPath);

                    var zipBytes = System.IO.File.ReadAllBytes(zipPath);
                    return File(zipBytes, "application/zip", Path.GetFileName(zipPath));
                }
                else
                {
                    return NotFound("File or directory not found.");
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, "You do not have permission to download this file or directory.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Helper method to copy directories
        private static void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs)
        {
            DirectoryInfo dir = new DirectoryInfo(sourceDirName);
            DirectoryInfo[] dirs = dir.GetDirectories();

            // If the destination directory doesn't exist, create it.
            Directory.CreateDirectory(destDirName);

            // Get the files in the directory and copy them to the new location.
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string tempPath = Path.Combine(destDirName, file.Name);
                file.CopyTo(tempPath, false);
            }

            // If copying subdirectories, copy them and their contents to new location.
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string tempPath = Path.Combine(destDirName, subdir.Name);
                    DirectoryCopy(subdir.FullName, tempPath, copySubDirs);
                }
            }
        }
    }
}
