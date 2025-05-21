using Microsoft.AspNetCore.Mvc;
using Meeting.Data;
using Meeting.Models;
using Meeting.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System; // Assurez-vous que System est inclus pour Guid

namespace Admin.Controllers
{
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
            try
            {
                var meetings = await _db.Meetings
                    .Include(m => m.Template) 
                    .Where(m => m.ProjectId == projectId)
                    .ToListAsync();

       

                return Ok(meetings);
            }
            catch (Exception ex)
            {
                // Retourne un message d'erreur plus détaillé pour le débogage
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] Meetings meeting)
        {
            if (string.IsNullOrWhiteSpace(meeting.Title) || meeting.Date == default(DateTime) || meeting.ProjectId == Guid.Empty)
            {
                // Return a structured JSON error that frontend can parse
                return BadRequest(new { errors = new List<string> { "Title, Date, and ProjectId are required." } });
            }

            meeting.Id = Guid.NewGuid();

            if (meeting.ProjectId == Guid.Empty)
            {
                return BadRequest(new { errors = new List<string> { "Project ID cannot be empty." } });
            }

            var projectExists = await _db.Projects.AnyAsync(p => p.Id == meeting.ProjectId);
            if (!projectExists)
            {
                return BadRequest(new { errors = new List<string> { "The specified project does not exist." } });
            }

            if (meeting.TemplateId.HasValue) 
            {
                var templateExists = await _db.Templates.AnyAsync(t => t.Id == meeting.TemplateId.Value);
                if (!templateExists)
                {
                    // Return a structured JSON error
                    return BadRequest(new { errors = new List<string> { "Provided Template does not exist." } });
                }
            }

            _db.Meetings.Add(meeting);
            await _db.SaveChangesAsync();

            // Return a structured JSON success response
            return Ok(new { message = "Meeting created successfully!", meeting = meeting });
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
        [HttpPost("{meetingId}/archive")]
        public async Task<IActionResult> ArchiveMeeting(Guid meetingId)
        {
            var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == meetingId);
            if (meeting == null)
            {
                return NotFound(new { error = "Meeting not found." });
            }

            if (meeting.IsArchived)
            {
                return BadRequest(new { error = "Meeting is already archived." });
            }

            meeting.IsArchived = true;
            _db.Meetings.Update(meeting);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Meeting archived successfully." });
        }
        [HttpGet("archived")]
        public async Task<IActionResult> GetAllArchivedMeetings()
        {
            try
            {
                var archivedMeetings = await _db.Meetings
                    .Include(m => m.Template)
                    .Include(m => m.Project)
                    .Where(m => m.IsArchived)
                    .ToListAsync();

                return Ok(archivedMeetings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }
        [HttpGet("{meetingId}/tasks")]
        public async Task<IActionResult> GetTasksForMeeting(Guid meetingId)
        {
            try
            {
                var meeting = await _db.Meetings
                    .Include(m => m.Tasks)
                    .ThenInclude(t => t.AssignedTo)
                    .FirstOrDefaultAsync(m => m.Id == meetingId);

                if (meeting == null)
                {
                    return NotFound(new { error = "Meeting not found." });
                }

                return Ok(meeting.Tasks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }


    }
}