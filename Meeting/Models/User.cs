namespace Meeting.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public ICollection<ProjectUser>? ProjectUsers { get; set; }
    }
}
