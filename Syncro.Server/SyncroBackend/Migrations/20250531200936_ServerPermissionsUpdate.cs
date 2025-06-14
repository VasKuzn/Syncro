using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class ServerPermissionsUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "accountId",
                table: "SectorPermissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "assignedAt",
                table: "SectorPermissions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "serverId",
                table: "SectorPermissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_SectorPermissions_accountId",
                table: "SectorPermissions",
                column: "accountId");

            migrationBuilder.CreateIndex(
                name: "IX_SectorPermissions_serverId",
                table: "SectorPermissions",
                column: "serverId");

            migrationBuilder.AddForeignKey(
                name: "FK_SectorPermissions_Accounts_accountId",
                table: "SectorPermissions",
                column: "accountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SectorPermissions_Servers_serverId",
                table: "SectorPermissions",
                column: "serverId",
                principalTable: "Servers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SectorPermissions_Accounts_accountId",
                table: "SectorPermissions");

            migrationBuilder.DropForeignKey(
                name: "FK_SectorPermissions_Servers_serverId",
                table: "SectorPermissions");

            migrationBuilder.DropIndex(
                name: "IX_SectorPermissions_accountId",
                table: "SectorPermissions");

            migrationBuilder.DropIndex(
                name: "IX_SectorPermissions_serverId",
                table: "SectorPermissions");

            migrationBuilder.DropColumn(
                name: "accountId",
                table: "SectorPermissions");

            migrationBuilder.DropColumn(
                name: "assignedAt",
                table: "SectorPermissions");

            migrationBuilder.DropColumn(
                name: "serverId",
                table: "SectorPermissions");
        }
    }
}
