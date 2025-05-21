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

            // Add current user as participant
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
        public IActionResult GetDivisions()
        {
            return Ok(_db.Users.ToList());
        }
    }

}
