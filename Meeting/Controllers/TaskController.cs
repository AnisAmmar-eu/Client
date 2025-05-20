using Microsoft.AspNetCore.Mvc;

namespace Admin.Controllers
{
    using Meeting.Data;
    using Meeting.Models;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;



    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TaskController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("meeting/{meetingId}")]
        public async Task<IActionResult> GetTasks(Guid meetingId)
        {
            var tasks = await _db.Tasks
                .Include(t => t.AssignedTo)
                .Where(t => t.MeetingId == meetingId)
                .ToListAsync();

            return Ok(tasks);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskItem task)
        {
            task.Id = Guid.NewGuid();

            var meetingExists = await _db.Meetings.AnyAsync(m => m.Id == task.MeetingId);
            if (!meetingExists) return BadRequest("Meeting does not exist");

            var userExists = await _db.Users.AnyAsync(u => u.Id == task.AssignedToUserId);
            if (!userExists) return BadRequest("Assigned user does not exist");

            _db.Tasks.Add(task);
            await _db.SaveChangesAsync();

            return Ok(task);
        }
    }

}
