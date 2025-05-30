﻿using Meeting.Services.ProjectManagerAPI.Services;
using Meeting.Data;
using Meeting.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization; 

namespace Admin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext db;
        private readonly IJwtService jwt;

        public AuthController(AppDbContext db, IJwtService jwt)
        {
            this.db = db;
            this.jwt = jwt;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User model)
        {
            if (await db.Users.AnyAsync(u => u.Email == model.Email))
                return BadRequest("Email already registered.");

            model.Password = HashPassword(model.Password);
            model.Id = Guid.NewGuid();
            db.Users.Add(model);
            await db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User model)
        {
            var user = await db.Users.SingleOrDefaultAsync(u => u.Email == model.Email);
            if (user == null || user.Password != HashPassword(model.Password))
                return Unauthorized();

            var token = jwt.GenerateToken(user.Id, user.Email);
            return Ok(new { token });
        }

        [HttpGet("users/search")]
        // [Authorize] // Décommentez cette ligne si seuls les utilisateurs authentifiés peuvent effectuer la recherche
        public async Task<IActionResult> SearchUsers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
   
                return Ok(new List<User>());
           
            }

        
            var users = await db.Users
                                .Where(u => u.Email.Contains(query) || u.FullName.Contains(query)) 
                                .Select(u => new
                                {
                                    u.Id,
                                    u.Email,
                                    u.FullName
                                })
                                .ToListAsync();

            if (!users.Any())
            {
                return NotFound("No users found matching the query.");
            }

            return Ok(users);
        }


        private string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}