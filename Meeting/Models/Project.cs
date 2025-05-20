namespace Meeting.Models
{
    public class Project
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public ICollection<ProjectUser>? ProjectUsers { get; set; }
        public ICollection<Meetings>? Meetings { get; set; }
    }

}
