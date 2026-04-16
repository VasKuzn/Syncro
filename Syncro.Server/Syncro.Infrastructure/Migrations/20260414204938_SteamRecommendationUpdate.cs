using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SteamRecommendationUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddForeignKey(
                name: "FK_SteamRecommendations_Accounts_Id",
                table: "SteamRecommendations",
                column: "Id",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SteamRecommendations_Accounts_Id",
                table: "SteamRecommendations");
        }
    }
}
