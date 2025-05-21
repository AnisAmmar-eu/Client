namespace Meeting.Models
{
    public class MeetingUser
    {
        public Guid MeetingId { get; set; }
        public Meetings Meeting { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; }
    }
}
