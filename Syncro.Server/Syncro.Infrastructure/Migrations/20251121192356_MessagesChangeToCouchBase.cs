using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MessagesChangeToCouchBase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Messages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    FileName = table.Column<string>(type: "text", nullable: true),
                    MediaType = table.Column<int>(type: "integer", nullable: true),
                    MediaUrl = table.Column<string>(type: "text", nullable: true),
                    accountId = table.Column<Guid>(type: "uuid", nullable: false),
                    accountNickname = table.Column<string>(type: "text", nullable: true),
                    groupConferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    isEdited = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    isPinned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    isRead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    messageContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    messageDateSent = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    personalConferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    previousMessageContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    referenceMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    sectorId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Accounts_accountId",
                        column: x => x.accountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_GroupConferences_groupConferenceId",
                        column: x => x.groupConferenceId,
                        principalTable: "GroupConferences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_PersonalConferences_personalConferenceId",
                        column: x => x.personalConferenceId,
                        principalTable: "PersonalConferences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_Sectors_sectorId",
                        column: x => x.sectorId,
                        principalTable: "Sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_accountId",
                table: "Messages",
                column: "accountId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_groupConferenceId",
                table: "Messages",
                column: "groupConferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_personalConferenceId",
                table: "Messages",
                column: "personalConferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_sectorId",
                table: "Messages",
                column: "sectorId");
        }
    }
}
