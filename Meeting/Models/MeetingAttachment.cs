using System;

namespace Meeting.Models
{
    public class MeetingAttachment
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public Guid MeetingId { get; set; }
        public Meetings? Meeting { get; set; }
    }
}
