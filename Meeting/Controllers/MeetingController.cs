using Microsoft.AspNetCore.Mvc;
using Meeting.Data;
using Meeting.Models;
using Meeting.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System; // Assurez-vous que System est inclus pour Guid
using System.IO.Compression;

namespace Admin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MeetingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly EmailService _emailService;

        private readonly ILogger<MeetingController> _logger;

        public MeetingController(AppDbContext db, EmailService emailService, ILogger<MeetingController> logger)
        {
            _db = db;
            _emailService = emailService;
            _logger = logger;
        }


        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetMeetings(Guid projectId)
        {
            try
            {
                Console.WriteLine($"[LOG] Appel GetMeetings pour projectId: {projectId}");

                var meetings = await _db.Meetings
                    .Include(m => m.Template)
                    .Where(m => m.ProjectId == projectId)
                    .ToListAsync();

                Console.WriteLine($"[LOG] {meetings.Count} réunions récupérées pour le projet {projectId}");

                return Ok(meetings);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetMeetings failed: {ex.Message}");
                Console.WriteLine($"[STACK] {ex.StackTrace}");

                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }


        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] Meetings meeting)
        {
            if (string.IsNullOrWhiteSpace(meeting.Title) || meeting.Date == default(DateTime) || meeting.ProjectId == Guid.Empty)
            {
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
                    return BadRequest(new { errors = new List<string> { "Provided Template does not exist." } });
                }
            }

            _db.Meetings.Add(meeting);
            await _db.SaveChangesAsync();

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
        [HttpPost("{meetingId}/attachments")]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> UploadAttachment(Guid meetingId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file uploaded." });

            var meeting = await _db.Meetings.FindAsync(meetingId);
            if (meeting == null)
                return NotFound(new { error = "Meeting not found." });

            var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "attachments");
            if (!Directory.Exists(uploadsRoot))
                Directory.CreateDirectory(uploadsRoot);

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsRoot, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new MeetingAttachment
            {
                Id = Guid.NewGuid(),
                FileName = file.FileName,
                FilePath = $"/attachments/{uniqueFileName}",
                MeetingId = meetingId
            };

            _db.MeetingAttachments.Add(attachment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "File uploaded successfully.", attachment });
        }
        [HttpGet("{meetingId}/attachments")]
        public async Task<IActionResult> GetAttachments(Guid meetingId)
        {
            var attachments = await _db.MeetingAttachments
                .Where(a => a.MeetingId == meetingId)
                .ToListAsync();

            return Ok(attachments);
        }


        [HttpGet("{meetingId}/attachments/download")]
        public async Task<IActionResult> DownloadAttachmentsAsZip(Guid meetingId)
        {
            var meeting = await _db.Meetings.FindAsync(meetingId);
            if (meeting == null)
                return NotFound(new { error = "Meeting not found." });

            var attachments = await _db.MeetingAttachments
                .Where(a => a.MeetingId == meetingId)
                .ToListAsync();

            if (!attachments.Any())
                return NotFound(new { error = "No attachments found for this meeting." });

            var zipFileName = $"meeting_{meetingId}_attachments.zip";
            var tempFolderPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempFolderPath);

            foreach (var attachment in attachments)
            {
                var sourcePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", attachment.FilePath.TrimStart('/'));
                var destPath = Path.Combine(tempFolderPath, attachment.FileName);

                if (System.IO.File.Exists(sourcePath))
                    System.IO.File.Copy(sourcePath, destPath, overwrite: true);
            }

            var zipPath = Path.Combine(Path.GetTempPath(), zipFileName);
            ZipFile.CreateFromDirectory(tempFolderPath, zipPath);

            var zipBytes = await System.IO.File.ReadAllBytesAsync(zipPath);

            Directory.Delete(tempFolderPath, true);
            System.IO.File.Delete(zipPath);

            return File(zipBytes, "application/zip", zipFileName);
        }
        [HttpDelete("archived/{meetingId}")]
        public async Task<IActionResult> DeleteArchivedMeeting(Guid meetingId)
        {
            var meeting = await _db.Meetings
                .Include(m => m.Tasks)
                .FirstOrDefaultAsync(m => m.Id == meetingId);

            if (meeting == null)
                return NotFound(new { error = "Meeting not found." });

            if (!meeting.IsArchived)
                return BadRequest(new { error = "Only archived meetings can be deleted." });

            // Supprimer les fichiers physiques
            var attachments = await _db.MeetingAttachments
                .Where(a => a.MeetingId == meetingId)
                .ToListAsync();

            foreach (var attachment in attachments)
            {
                var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", attachment.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(physicalPath))
                    System.IO.File.Delete(physicalPath);
            }

            // Supprimer les attachments en base
            _db.MeetingAttachments.RemoveRange(attachments);

            // Supprimer la réunion
            _db.Meetings.Remove(meeting);

            await _db.SaveChangesAsync();

            return Ok(new { message = "Archived meeting deleted successfully." });
        }

        [HttpGet("project/{projectId}/active")]
        public async Task<IActionResult> GetActiveMeetingsByProject(Guid projectId)
        {
            try
            {
                var activeMeetings = await _db.Meetings
                    .Include(m => m.Template)
                    .Include(m => m.Project)
                    .Where(m => !m.IsArchived && m.ProjectId == projectId)
                    .ToListAsync();

                return Ok(activeMeetings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetMeetingsByUser(Guid userId)
        {
            try
            {
                var meetings = await _db.Meetings
                    .Include(m => m.Tasks)
                    .ThenInclude(t => t.AssignedTo)
                    .Include(m => m.Project)
                    .Include(m => m.Template)
                    .Where(m => m.Tasks.Any(t => t.AssignedToUserId == userId))
                    .ToListAsync();

                return Ok(meetings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }
        [HttpGet("count-by-project")]
        public async Task<IActionResult> GetMeetingCountByProject()
        {
            try
            {
                var meetingCounts = await _db.Meetings
                    .GroupBy(m => m.ProjectId)
                    .Select(group => new
                    {
                        ProjectId = group.Key,
                        MeetingCount = group.Count()
                    })
                    .ToListAsync();

                return Ok(meetingCounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message} - StackTrace: {ex.StackTrace}");
            }
        }




    }
}