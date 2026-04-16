using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SteamRecommendationUpdate2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SteamRecommendations_Accounts_Id",
                table: "SteamRecommendations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SteamRecommendations",
                table: "SteamRecommendations");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "SteamRecommendations");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SteamRecommendations",
                table: "SteamRecommendations",
                column: "AccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_SteamRecommendations_Accounts_AccountId",
                table: "SteamRecommendations",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SteamRecommendations_Accounts_AccountId",
                table: "SteamRecommendations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SteamRecommendations",
                table: "SteamRecommendations");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "SteamRecommendations",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SteamRecommendations",
                table: "SteamRecommendations",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SteamRecommendations_Accounts_Id",
                table: "SteamRecommendations",
                column: "Id",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
