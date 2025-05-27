using System.ComponentModel.DataAnnotations.Schema;

namespace Meeting.Models
{
    public class Project
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ProjectUser>? ProjectUsers { get; set; }
        public ICollection<Meetings>? Meetings { get; set; }
    }
}
