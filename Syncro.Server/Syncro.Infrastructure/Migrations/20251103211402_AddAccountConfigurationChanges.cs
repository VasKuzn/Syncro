using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountConfigurationChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "dateOfLastChange",
                table: "PersonalAccountInfo");

            migrationBuilder.DropColumn(
                name: "isHidden",
                table: "PersonalAccountInfo");

            migrationBuilder.DropColumn(
                name: "isOnline",
                table: "Accounts");

            migrationBuilder.AddColumn<int>(
                name: "country",
                table: "PersonalAccountInfo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "avatar",
                table: "Accounts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "country",
                table: "PersonalAccountInfo");

            migrationBuilder.DropColumn(
                name: "avatar",
                table: "Accounts");

            migrationBuilder.AddColumn<DateTime>(
                name: "dateOfLastChange",
                table: "PersonalAccountInfo",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<bool>(
                name: "isHidden",
                table: "PersonalAccountInfo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "isOnline",
                table: "Accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
