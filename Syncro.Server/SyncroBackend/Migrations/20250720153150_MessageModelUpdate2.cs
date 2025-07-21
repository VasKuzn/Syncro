using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class MessageModelUpdate2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MediaType",
                table: "Messages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaUrl",
                table: "Messages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaUrl",
                table: "Messages");
        }
    }
}
