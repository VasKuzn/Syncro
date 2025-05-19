using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class GroupConferenceMemberUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "roleId",
                table: "GroupConferenceMembers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_GroupConferenceMembers_roleId",
                table: "GroupConferenceMembers",
                column: "roleId");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupConferenceMembers_ConferenceRoles_roleId",
                table: "GroupConferenceMembers",
                column: "roleId",
                principalTable: "ConferenceRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupConferenceMembers_ConferenceRoles_roleId",
                table: "GroupConferenceMembers");

            migrationBuilder.DropIndex(
                name: "IX_GroupConferenceMembers_roleId",
                table: "GroupConferenceMembers");

            migrationBuilder.DropColumn(
                name: "roleId",
                table: "GroupConferenceMembers");
        }
    }
}
