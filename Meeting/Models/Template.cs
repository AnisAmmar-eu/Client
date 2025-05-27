namespace Meeting.Models
{
    public class Template
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Objectives { get; set; }
        public string NonObjectives { get; set; }
        public string Agenda { get; set; }
    }
}
