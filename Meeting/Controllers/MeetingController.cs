using Microsoft.AspNetCore.Mvc;

namespace Admin.Controllers
{
    using Meeting.Data;
    using Meeting.Models;
    using Meeting.Services;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;


    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MeetingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly EmailService _emailService;

        public MeetingController(AppDbContext db, EmailService emailService)
        {
            _db = db;
            _emailService = emailService;
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetMeetings(Guid projectId)
        {
            var meetings = await _db.Meetings
                .Include(m => m.Template)
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();

            return Ok(meetings);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] Meetings meeting)
        {
            meeting.Id = Guid.NewGuid();

            // Verify project exists
            var projectExists = await _db.Projects.AnyAsync(p => p.Id == meeting.ProjectId);
            if (!projectExists) return BadRequest("Project does not exist");

            // Verify template exists
            var templateExists = await _db.Templates.AnyAsync(t => t.Id == meeting.TemplateId);
            if (!templateExists) return BadRequest("Template does not exist");

            _db.Meetings.Add(meeting);
            await _db.SaveChangesAsync();

            return Ok(meeting);
        }
        [HttpPost("{meetingId}/invite")]
        public async Task<IActionResult> InviteParticipants(Guid meetingId, [FromBody] List<Guid> participantUserIds)
        {
            var meeting = await _db.Meetings.Include(m => m.Project).FirstOrDefaultAsync(m => m.Id == meetingId);
            if (meeting == null) return NotFound("Meeting not found.");

            var users = await _db.Users.Where(u => participantUserIds.Contains(u.Id)).ToListAsync();

            foreach (var user in users)
            {
                // Envoi mail
                var subject = $"Invitation à la réunion: {meeting.Title}";
                var body = $"Bonjour {user.FullName},<br/>" +
                    $"Vous êtes invité à la réunion '{meeting.Title}' du projet '{meeting.Project.Name}'.<br/>" +
                    $"Date et heure : {meeting.Date:G}<br/>" +
                    $"Merci de confirmer votre présence.";

                await _emailService.SendEmailAsync(user.Email, subject, body);

            }

            return Ok("Invitations envoyées.");
        }

    }

}
