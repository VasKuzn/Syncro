using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class MessageModelUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "accountNickname",
                table: "Messages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "accountNickname",
                table: "Messages");
        }
    }
}
