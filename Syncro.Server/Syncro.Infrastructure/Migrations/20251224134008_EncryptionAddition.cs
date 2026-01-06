using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Syncro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EncryptionAddition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EncryptionSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionData = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp", nullable: false),
                    LastUsed = table.Column<DateTime>(type: "timestamp", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptionSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GroupEncryptionKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    GroupConferenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderKey = table.Column<string>(type: "text", nullable: false),
                    DistributionMessage = table.Column<string>(type: "text", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChainId = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupEncryptionKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserEncryptionKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PublicKey = table.Column<string>(type: "text", nullable: false),
                    SignedPreKey = table.Column<string>(type: "text", nullable: true),
                    OneTimePreKeys = table.Column<string>(type: "text", nullable: true),
                    IdentityKey = table.Column<string>(type: "text", nullable: true),
                    LastUpdated = table.Column<DateTime>(type: "timestamp", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserEncryptionKeys", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EncryptionSessions_UserId_ContactId",
                table: "EncryptionSessions",
                columns: new[] { "UserId", "ContactId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupEncryptionKeys_GroupConferenceId",
                table: "GroupEncryptionKeys",
                column: "GroupConferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupEncryptionKeys_GroupConferenceId_IsActive",
                table: "GroupEncryptionKeys",
                columns: new[] { "GroupConferenceId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserEncryptionKeys_UserId",
                table: "UserEncryptionKeys",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EncryptionSessions");

            migrationBuilder.DropTable(
                name: "GroupEncryptionKeys");

            migrationBuilder.DropTable(
                name: "UserEncryptionKeys");
        }
    }
}
