namespace Syncro.Application.Services
{
    public interface IProtectionService
    {
        string Encrypt(string plaintext);
        string Decrypt(string ciphertext);
    }
}
