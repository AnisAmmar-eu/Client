namespace Meeting.Models
{
    public class TaskItem
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int DurationInMinutes { get; set; }
        public string Priority { get; set; } // Low, Medium, High

        public Guid AssignedToUserId { get; set; }
        public User AssignedTo { get; set; }

        public Guid MeetingId { get; set; }
        public Meetings Meeting { get; set; }
    }

}
