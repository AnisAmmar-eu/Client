using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meeting.Migrations
{
    public partial class Agenda : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AlterColumn<string>(
                name: "Priority",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AlterColumn<string>(
                name: "Priority",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
