namespace Meeting.Services.ProjectManagerAPI.Services
{
    public interface IJwtService
    {
        string GenerateToken(Guid userId, string email);
    }
}