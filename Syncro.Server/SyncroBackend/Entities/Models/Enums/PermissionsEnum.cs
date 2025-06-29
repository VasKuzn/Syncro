namespace SyncroBackend.Entities.Models.Enums
{
    [Flags]
    public enum Permissions : ulong
    {
        None = 0,
        ManageMessages = 1 << 0,    // 1 (0001)
        KickMembers = 1 << 1,       // 2 (0010)
        BanMembers = 1 << 2,        // 4 (0100)
        ManageRoles = 1 << 3,       // 8 (1000)

        SendMessages = 1 << 4,      // 16 (0001 0000)
        EditMessages = 1 << 5,      // 32 (0010 0000)
        DeleteMessages = 1 << 6,    // 64 (0100 0000)

        // Комбинированные разрешения (для удобства)
        BasicMessaging = SendMessages | EditMessages | DeleteMessages, //112
        Moderator = KickMembers | BanMembers | ManageMessages, // 7
        Administrator = Moderator | ManageRoles | BasicMessaging // 127
    }
}