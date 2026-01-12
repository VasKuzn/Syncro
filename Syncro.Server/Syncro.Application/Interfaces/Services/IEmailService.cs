using Syncro.Domain.Utils;

namespace Syncro.Application.Services
{
    public interface IEmailService
    {
        public Task<Result<string>> SendEmailAsync(string email_to, string email_subject, string email_body);
    }
}