using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncroBackend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    nickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    password = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    firstname = table.Column<string>(type: "text", nullable: true),
                    lastname = table.Column<string>(type: "text", nullable: true),
                    phonenumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GroupConferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    conferenceName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    groupConferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupConferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Friends",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    userWhoSent = table.Column<Guid>(type: "uuid", nullable: false),
                    userWhoRecieved = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    friendsSince = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Friends", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Friends_Accounts_userWhoRecieved",
                        column: x => x.userWhoRecieved,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Friends_Accounts_userWhoSent",
                        column: x => x.userWhoSent,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PersonalAccountInfo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    isHidden = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    dateOfAccountCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    dateOfLastOnline = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    dateOfLastChange = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonalAccountInfo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonalAccountInfo_Accounts_Id",
                        column: x => x.Id,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PersonalConferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user1 = table.Column<Guid>(type: "uuid", nullable: false),
                    user2 = table.Column<Guid>(type: "uuid", nullable: false),
                    isFriend = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    startingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    lastActivity = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    callType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonalConferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonalConferences_Accounts_user1",
                        column: x => x.user1,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PersonalConferences_Accounts_user2",
                        column: x => x.user2,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Servers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    serverName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ownerId = table.Column<Guid>(type: "uuid", nullable: false),
                    serverDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    creationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Servers_Accounts_ownerId",
                        column: x => x.ownerId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupConferenceMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    accountId = table.Column<Guid>(type: "uuid", nullable: false),
                    groupConferenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    joiningDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    groupConferenceNickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupConferenceMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupConferenceMembers_Accounts_accountId",
                        column: x => x.accountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupConferenceMembers_GroupConferences_groupConferenceId",
                        column: x => x.groupConferenceId,
                        principalTable: "GroupConferences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    serverId = table.Column<Guid>(type: "uuid", nullable: false),
                    roleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    rolePermissions = table.Column<long>(type: "bigint", nullable: false),
                    color = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    isDisplayedSeparetely = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    position = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roles_Servers_serverId",
                        column: x => x.serverId,
                        principalTable: "Servers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sectors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    serverId = table.Column<Guid>(type: "uuid", nullable: false),
                    sectorName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sectorDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    sectorType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    isPrivate = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sectors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sectors_Servers_serverId",
                        column: x => x.serverId,
                        principalTable: "Servers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServerMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    serverId = table.Column<Guid>(type: "uuid", nullable: false),
                    accountId = table.Column<Guid>(type: "uuid", nullable: false),
                    joiningDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    serverNickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    isBanned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    banReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServerMembers_Accounts_accountId",
                        column: x => x.accountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServerMembers_Servers_serverId",
                        column: x => x.serverId,
                        principalTable: "Servers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServerMemberRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    serverId = table.Column<Guid>(type: "uuid", nullable: false),
                    accountId = table.Column<Guid>(type: "uuid", nullable: false),
                    roleId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerMemberRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServerMemberRoles_Accounts_accountId",
                        column: x => x.accountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServerMemberRoles_Roles_roleId",
                        column: x => x.roleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServerMemberRoles_Servers_serverId",
                        column: x => x.serverId,
                        principalTable: "Servers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    messageContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    messageDateSent = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    accountId = table.Column<Guid>(type: "uuid", nullable: false),
                    personalConferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    groupConferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    sectorId = table.Column<Guid>(type: "uuid", nullable: true),
                    isEdited = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    previousMessageContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    isPinned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    isRead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    referenceMessageId = table.Column<Guid>(type: "uuid", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "SectorPermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    roleId = table.Column<Guid>(type: "uuid", nullable: false),
                    sectorId = table.Column<Guid>(type: "uuid", nullable: false),
                    sectorPermissions = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectorPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SectorPermissions_Roles_roleId",
                        column: x => x.roleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SectorPermissions_Sectors_sectorId",
                        column: x => x.sectorId,
                        principalTable: "Sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Friends_userWhoRecieved",
                table: "Friends",
                column: "userWhoRecieved");

            migrationBuilder.CreateIndex(
                name: "IX_Friends_userWhoSent_userWhoRecieved",
                table: "Friends",
                columns: new[] { "userWhoSent", "userWhoRecieved" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupConferenceMembers_accountId",
                table: "GroupConferenceMembers",
                column: "accountId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupConferenceMembers_groupConferenceId",
                table: "GroupConferenceMembers",
                column: "groupConferenceId");

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

            migrationBuilder.CreateIndex(
                name: "IX_PersonalConferences_user1",
                table: "PersonalConferences",
                column: "user1");

            migrationBuilder.CreateIndex(
                name: "IX_PersonalConferences_user2",
                table: "PersonalConferences",
                column: "user2");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_serverId",
                table: "Roles",
                column: "serverId");

            migrationBuilder.CreateIndex(
                name: "IX_SectorPermissions_roleId",
                table: "SectorPermissions",
                column: "roleId");

            migrationBuilder.CreateIndex(
                name: "IX_SectorPermissions_sectorId",
                table: "SectorPermissions",
                column: "sectorId");

            migrationBuilder.CreateIndex(
                name: "IX_Sectors_serverId",
                table: "Sectors",
                column: "serverId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerMemberRoles_accountId",
                table: "ServerMemberRoles",
                column: "accountId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerMemberRoles_roleId",
                table: "ServerMemberRoles",
                column: "roleId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerMemberRoles_serverId",
                table: "ServerMemberRoles",
                column: "serverId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerMembers_accountId",
                table: "ServerMembers",
                column: "accountId");

            migrationBuilder.CreateIndex(
                name: "IX_ServerMembers_serverId",
                table: "ServerMembers",
                column: "serverId");

            migrationBuilder.CreateIndex(
                name: "IX_Servers_ownerId",
                table: "Servers",
                column: "ownerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Friends");

            migrationBuilder.DropTable(
                name: "GroupConferenceMembers");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "PersonalAccountInfo");

            migrationBuilder.DropTable(
                name: "SectorPermissions");

            migrationBuilder.DropTable(
                name: "ServerMemberRoles");

            migrationBuilder.DropTable(
                name: "ServerMembers");

            migrationBuilder.DropTable(
                name: "GroupConferences");

            migrationBuilder.DropTable(
                name: "PersonalConferences");

            migrationBuilder.DropTable(
                name: "Sectors");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Servers");

            migrationBuilder.DropTable(
                name: "Accounts");
        }
    }
}
