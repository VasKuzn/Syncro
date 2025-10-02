using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountOnline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isOnline",
                table: "Accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isOnline",
                table: "Accounts");
        }
    }
}
