using Syncro.Domain.Utils;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;

namespace Syncro.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private string? _email;
        private string? _smtpServer;
        private string? _pseudonim;
        private int _port;
        private string? _emailToken;

        public EmailService(IConfiguration configuration)
        {
            _email = configuration["Email:EmailAddress"];
            _smtpServer = configuration["Email:EmailServer"];
            _emailToken = configuration["Email:EmailToken"];
            _pseudonim = configuration["Email:EmailPseudonim"];
            _port = Int32.Parse(configuration["Email:EmailPort"]); // пофиг, не буду пока проверки делать, всё равно to do ещё
        }

        public async Task<Result<string>> SendEmailAsync(string email_to, string email_subject, string email_body)
        {
            var emailMessage = new MimeMessage();

            emailMessage.From.Add(new MailboxAddress(_pseudonim, _email));
            emailMessage.To.Add(new MailboxAddress("", email_to));
            emailMessage.Subject = email_subject;
            emailMessage.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = email_body
            };

            using (var client = new SmtpClient())
            {
                await client.ConnectAsync(_smtpServer, _port, true);
                await client.AuthenticateAsync(_email, _emailToken);
                await client.SendAsync(emailMessage);
                await client.DisconnectAsync(true);
            }

            return Result<string>.Success("Email sended");
        }

    }
}