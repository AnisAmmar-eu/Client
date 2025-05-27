using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meeting.Migrations
{
    public partial class AddListeeee : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Objectives",
                table: "Templates",
                newName: "ObjectivesJson");

            migrationBuilder.RenameColumn(
                name: "NonObjectives",
                table: "Templates",
                newName: "NonObjectivesJson");

            migrationBuilder.RenameColumn(
                name: "Agenda",
                table: "Templates",
                newName: "AgendaJson");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ObjectivesJson",
                table: "Templates",
                newName: "Objectives");

            migrationBuilder.RenameColumn(
                name: "NonObjectivesJson",
                table: "Templates",
                newName: "NonObjectives");

            migrationBuilder.RenameColumn(
                name: "AgendaJson",
                table: "Templates",
                newName: "Agenda");
        }
    }
}
