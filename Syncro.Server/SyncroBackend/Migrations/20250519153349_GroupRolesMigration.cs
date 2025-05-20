using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class GroupRolesMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConferenceRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    rolePermissions = table.Column<long>(type: "bigint", nullable: false),
                    conferenceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConferenceRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConferenceRoles_GroupConferences_conferenceId",
                        column: x => x.conferenceId,
                        principalTable: "GroupConferences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceRoles_conferenceId",
                table: "ConferenceRoles",
                column: "conferenceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConferenceRoles");
        }
    }
}
