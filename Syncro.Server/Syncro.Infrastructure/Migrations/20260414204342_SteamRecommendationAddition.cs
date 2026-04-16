using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SteamRecommendationAddition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SteamRecommendations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    SteamId = table.Column<string>(type: "text", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstGame = table.Column<string>(type: "text", nullable: true),
                    SecondGame = table.Column<string>(type: "text", nullable: true),
                    ThirdGame = table.Column<string>(type: "text", nullable: true),
                    LastTimeUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamRecommendations", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SteamRecommendations");
        }
    }
}
