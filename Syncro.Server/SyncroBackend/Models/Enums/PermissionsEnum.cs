namespace SyncroBackend.Models.Enums
{
    [Flags]
    public enum Permissions : ulong
    {
        None = 0,
        ManageMessages = 1 << 0,    // 1 (0001)
        KickMembers = 1 << 1,       // 2 (0010)
        BanMembers = 1 << 2,        // 4 (0100)
        ManageRoles = 1 << 3,       // 8 (1000)
    }
}