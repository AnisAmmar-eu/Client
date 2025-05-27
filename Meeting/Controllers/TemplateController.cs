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
    public class TemplateController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TemplateController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            var templates = await _db.Templates.ToListAsync();
            return Ok(templates);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTemplate([FromBody] Template template)
        {
            template.Id = Guid.NewGuid();
            _db.Templates.Add(template);
            await _db.SaveChangesAsync();
            return Ok(template);
        }
    }

}
