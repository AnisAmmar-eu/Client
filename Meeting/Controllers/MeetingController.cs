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
                    .Include(m => m.Template) // Gardez ceci pour inclure le template s'il existe
                    .Where(m => m.ProjectId == projectId)
                    .ToListAsync();

                // Solution la plus probable pour l'erreur 500 : Configuration du sérialiseur JSON.
                // Si vous utilisez System.Text.Json (par défaut dans .NET 6+), ajoutez ceci à Program.cs / Startup.cs:
                // services.AddControllers().AddJsonOptions(options =>
                // {
                //     options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                //     // options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // Bonne pratique
                // });
                // Si vous utilisez Newtonsoft.Json, configurez-le pour ignorer les boucles de référence.

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
            meeting.Id = Guid.NewGuid();

            // Vérifier que le projet existe
            var projectExists = await _db.Projects.AnyAsync(p => p.Id == meeting.ProjectId);
            if (!projectExists)
            {
                return BadRequest("Project does not exist");
            }

            // **MODIFICATION ICI : Rendre la vérification du template optionnelle**
            if (meeting.TemplateId.HasValue) // Vérifie si un TemplateId a été fourni
            {
                var templateExists = await _db.Templates.AnyAsync(t => t.Id == meeting.TemplateId.Value);
                if (!templateExists)
                {
                    return BadRequest("Provided Template does not exist");
                }
            }
            // Si meeting.TemplateId.HasValue est faux, cela signifie que TemplateId est null,
            // et nous n'avons pas besoin de vérifier s'il existe dans la DB.

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