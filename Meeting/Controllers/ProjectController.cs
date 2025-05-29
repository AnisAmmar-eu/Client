using Microsoft.AspNetCore.Mvc;

namespace Meeting.Controllers
{
    using Meeting.Models;
    using Meeting.Data;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;


    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProjectController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("projects")]
        public async Task<IActionResult> GetProjects()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user ID in token.");
            }

            var projects = await _db.ProjectUsers
                .Where(pu => pu.UserId == userId)
                .Select(pu => pu.Project)
                .ToListAsync();

            return Ok(projects);
        }


        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user ID in token.");
            }

            project.Id = Guid.NewGuid();

            _db.Projects.Add(project);

            _db.ProjectUsers.Add(new ProjectUser { ProjectId = project.Id, UserId = userId });

            await _db.SaveChangesAsync();

            return Ok(project);
        }


        [HttpPost("{projectId}/addParticipant/{userId}")]
        public async Task<IActionResult> AddParticipant(Guid projectId, Guid userId)
        {
            var exists = await _db.ProjectUsers.AnyAsync(pu => pu.ProjectId == projectId && pu.UserId == userId);
            if (exists) return BadRequest("Participant already added.");

            _db.ProjectUsers.Add(new ProjectUser { ProjectId = projectId, UserId = userId });
            await _db.SaveChangesAsync();

            return Ok();
        }
        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            return Ok(_db.Users.ToList());
        }

        [HttpPost("uploadUsers")]
        public async Task<IActionResult> UploadUsers(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only .xlsx files are allowed.");
            }

            var newUsers = new List<User>();
            var errors = new List<string>();

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                using (var package = new OfficeOpenXml.ExcelPackage(stream))
                {
                    var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null)
                    {
                        return BadRequest("The Excel file does not contain any worksheets.");
                    }

                    var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    for (int col = 1; col <= worksheet.Dimension.End.Column; col++)
                    {
                        var cellValue = worksheet.Cells[1, col].Text?.Trim();
                        if (!string.IsNullOrEmpty(cellValue))
                        {
                            headers[cellValue] = col;
                        }
                    }

                    int fullNameCol = headers.GetValueOrDefault("FullName", 0);
                    int emailCol = headers.GetValueOrDefault("Email", 0);

                    if (fullNameCol == 0 || emailCol == 0)
                    {
                        return BadRequest("Excel file must contain 'FullName' and 'Email' columns.");
                    }

                    for (int rowNum = 2; rowNum <= worksheet.Dimension.End.Row; rowNum++)
                    {
                        try
                        {
                            var fullName = worksheet.Cells[rowNum, fullNameCol].Text?.Trim();
                            var email = worksheet.Cells[rowNum, emailCol].Text?.Trim();

                            if (string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(email))
                            {
                                errors.Add($"Row {rowNum}: Missing 'FullName' or 'Email'. Skipping this row.");
                                continue;
                            }

                            if (!IsValidEmail(email))
                            {
                                errors.Add($"Row {rowNum}: Invalid email format for '{email}'. Skipping this row.");
                                continue;
                            }

                            if (await _db.Users.AnyAsync(u => u.Email == email))
                            {
                                errors.Add($"Row {rowNum}: User with email '{email}' already exists. Skipping this row.");
                                continue;
                            }

                            var user = new User
                            {
                                Id = Guid.NewGuid(),
                                FullName = fullName,
                                Email = email
                            };

                            _db.Users.Add(user);
                            newUsers.Add(user);
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Row {rowNum}: An unexpected error occurred: {ex.Message}.");
                        }
                    }

                    if (newUsers.Any())
                    {
                        await _db.SaveChangesAsync();
                    }
                }
            }

            if (errors.Any())
            {
                return Ok(new
                {
                    Message = $"Processed file. Successfully created {newUsers.Count} new users. Encountered errors for some rows.",
                    NewUsers = newUsers.Select(u => new { u.Id, u.FullName, u.Email }),
                    Errors = errors
                });
            }

            return Ok(new
            {
                Message = $"Successfully created {newUsers.Count} new users from Excel file.",
                NewUsers = newUsers.Select(u => new { u.Id, u.FullName, u.Email })
            });
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetProjectsByUser(Guid userId)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return NotFound(new { error = "User not found." });
            }

            var projects = await _db.ProjectUsers
                .Where(pu => pu.UserId == userId)
                .Select(pu => pu.Project)
                .ToListAsync();

            return Ok(projects);
        }
        [HttpGet("user-project-counts")]
        public async Task<IActionResult> GetProjectCountsPerUser()
        {
            var userProjectCounts = await _db.Users
                .Select(user => new
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    ProjectCount = _db.ProjectUsers.Count(pu => pu.UserId == user.Id)
                })
                .ToListAsync();

            return Ok(userProjectCounts);
        }

    }
}


