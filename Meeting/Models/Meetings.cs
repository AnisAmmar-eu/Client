
namespace Meeting.Models
{
    public class Meetings
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public Guid ProjectId { get; set; }
        public Project Project { get; set; }

        public DateTime Date { get; set; }
        public string Location { get; set; } = "";
        public Guid? TemplateId { get; set; }
        public Template? Template { get; set; }

        public ICollection<TaskItem> Tasks { get; set; }
    }

}
