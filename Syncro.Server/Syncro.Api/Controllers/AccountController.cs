using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Syncro.Application.TransferModels;
using Syncro.Infrastructure.Data.DataBaseContext;
using Syncro.Infrastructure.Exceptions;
using Syncro.Infrastructure.Services;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IPersonalAccountInfoService _infoService;
        private readonly DataBaseContext _context;
        private readonly ILogger<AccountController> _logger;

        private readonly IEmailService _emailService;

        public AccountController(IAccountService accountService, IPersonalAccountInfoService infoService, IEmailService emailService, DataBaseContext context, ILogger<AccountController> logger)
        {
            _accountService = accountService;
            _infoService = infoService;
            _emailService = emailService;
            _context = context;
            _logger = logger;
        }

        // GET: api/accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountNoPasswordModel>>> GetAllAccounts()
        {
            try
            {
                var accounts = await _accountService.GetAllAccountsAsync();

                List<AccountNoPasswordModel> accountsNoPassword = new List<AccountNoPasswordModel>();

                foreach (var account in accounts)
                {
                    var accountNoPassword = TranferModelsMapper.AccountNoPasswordModelMapMapper(account);
                    accountsNoPassword.Add(accountNoPassword);
                }

                return Ok(accountsNoPassword);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/accounts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AccountNoPasswordWithIdModel>> GetAccountById(Guid id)
        {
            try
            {
                var account = await _accountService.GetAccountByIdAsync(id);
                var accountNoPassword = TranferModelsMapper.AccountNoPasswordWithIdModelMapMapper(account);
                return Ok(accountNoPassword);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/accounts/{email}/get
        [HttpGet("{email}/get")]
        public async Task<ActionResult<AccountNoPasswordModel>> GetAccountByEmail(string email)
        {
            try
            {
                var account = await _accountService.GetAccountByEmailAsync(email);
                var accountNoPassword = TranferModelsMapper.AccountNoPasswordModelMapMapper(account);
                return Ok(accountNoPassword);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/accounts/{nickname}/getnick
        [HttpGet("{nickname}/getnick")]
        public async Task<ActionResult<AccountNoPasswordWithIdModel>> GetAccountByNickname(string nickname)
        {
            try
            {
                var account = await _accountService.GetAccountByNicknameAsync(nickname);
                var accountNoPassword = TranferModelsMapper.AccountNoPasswordWithIdModelMapMapper(account);
                return Ok(accountNoPassword);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        //
        // POST: api/accounts
        [HttpPost]
        public async Task<ActionResult<AccountNoPasswordModel>> CreateAccount([FromBody] AccountModel account)
        {
            try
            {
                var createdAccount = await _accountService.CreateAccountAsync(account);
                var createdAccountNoPassword = TranferModelsMapper.AccountNoPasswordModelMapMapper(createdAccount);
                var createdPersonalAccountInfo = await _infoService.CreatePersonalAccountInfoAsync(account.Id);
                return CreatedAtAction(nameof(GetAccountById), new { id = createdAccount.Id }, createdAccountNoPassword);
            }
            catch (ConflictException ex)
            {
                return StatusCode(409, new
                {
                    success = false,
                    error = "Conflict",
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return StatusCode(400, new
                {
                    success = false,
                    error = "Validation error",
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = "Internal server error",
                    message = "An unexpected error occurred"
                });
            }
        }

        // PUT: api/accounts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] AccountModelDTO accountDto)
        {
            try
            {
                var updatedAccount = await _accountService.UpdateAccountAsync(id, accountDto);
                return Ok(updatedAccount);
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (ArgumentException ex)
            {
                return StatusCode(400, $"Bad request error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/accounts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(Guid id)
        {
            try
            {
                var result = await _accountService.DeleteAccountAsync(id);
                if (!result)
                {
                    return StatusCode(404, $"Account not found error: ID {id}");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // POST: api/accounts/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Application.ModelsDTO.LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return StatusCode(400, $"Bad request error: {ModelState}");
            }
            try
            {
                var result = await _accountService.Login(request.Email, request.Password);

                if (result.IsSuccess)
                {
                    HttpContext.Response.Cookies.Append("access-token", result.Value, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });
                    return Ok(new { Message = "Logged in successfully" });
                }
                return StatusCode(401, $"User unauthorized error: {result.Error}");
            }
            catch (Exception)
            {
                return StatusCode(404, $"Аккаунт с таким email не найден");
            }
        }
        // GET: api/accounts/current - получение accountid из выданного jwt
        [HttpGet("current")]
        [Authorize]
        public IActionResult GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Ok(new { UserId = userId });
        }

        /* personal account infos */

        // GET: получение всех personal account info (хз зачем может пригодиться)
        [HttpGet("personal_info")]
        public async Task<ActionResult<IEnumerable<PersonalAccountInfoModel>>> GetAllPersonalAccontInfos()
        {
            try
            {
                var infos = await _infoService.GetAllPersonalAccountInfosAsync();
                return Ok(infos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: получение personal account info по id
        [HttpGet("personal_info/{id}")]
        public async Task<ActionResult<PersonalAccountInfoModel>> GetPersonalAccountInfoById(Guid id)
        {
            try
            {
                var info = await _infoService.GetPersonalAccountInfoByIdAsync(id);
                return Ok(info);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // POST: api/accounts/personal_info/{id} - создание персональной информации при ее отсутствии(для тех у кого раньше не было, для разрабов в основе) 
        [HttpPost("personal_info/{id}")]
        public async Task<ActionResult<PersonalAccountInfoModel>> CreatePersonalAccountInfoAsync(Guid id)
        {
            try
            {
                var result = await _infoService.CreatePersonalAccountInfoAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: обновление personal account info по id
        [HttpPut("personal_info/{id}")]
        public async Task<IActionResult> UpdatePersonalAccountInfo(Guid id, [FromBody] PersonalAccountInfoModelDTO infoDto)
        {
            try
            {
                var updatedAccountsInfo = await _infoService.UpdatePersonalAccountInfoAsync(id, infoDto);
                return Ok(updatedAccountsInfo);
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, $"Account not found error: {ex.Message}");
            }
            catch (ArgumentException ex)
            {
                return StatusCode(400, $"Bad request error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: удаление personal account info по id
        [HttpDelete("personal_info/{id}")]
        public async Task<IActionResult> DeletePersonalAccountInfo(Guid id)
        {
            try
            {
                var result = await _infoService.DeletePersonalAccountInfoAsync(id);
                if (!result)
                {
                    return StatusCode(404, $"Account not found error: ID {id}");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        /* combined account+personalaccount for frontend  */

        //GET: api/accounts/full_account_info/{id} - вся инфа для обновления для фронтенда
        [HttpGet("full_account_info/{id}")]
        public async Task<ActionResult<AccountWithPersonalInfoNoPasswordModel>> GetAccountWithPersonalInfoAsync(Guid id)
        {
            try
            {
                var accountInfo = await _accountService.GetAccountByIdAsync(id);
                if (accountInfo is null)
                {
                    return NotFound($"Account with id {id} not found");
                }
                var personalInfo = await _infoService.GetPersonalAccountInfoByIdAsync(id);
                var fullAccountInfo = new AccountWithPersonalInfoModel
                {
                    nickname = accountInfo.nickname,
                    email = accountInfo.email,
                    password = accountInfo.password,
                    firstname = accountInfo.firstname,
                    lastname = accountInfo.lastname,
                    phonenumber = accountInfo.phonenumber,
                    avatar = accountInfo.avatar,
                    country = personalInfo.country,
                };
                return Ok(fullAccountInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        //PUT: api/accounts/full_account_info/{id} - запрос для обновления всей инфы пользователя
        [HttpPut("full_account_info/{id}")]
        public async Task<IActionResult> UpdateAccountWithPersonalInfoAsync(Guid id, [FromForm] AccountWithPersonalInfoModel model)
        {
            try
            {
                var countryUpdateResult = await _infoService.UpdatePersonalAccountCountryAsync(id, model.country);

                var updatedAccount = new AccountModelDTO
                {
                    nickname = model.nickname,
                    email = model.email,
                    password = model.password,
                    firstname = model.firstname,
                    lastname = model.lastname,
                    phonenumber = model.phonenumber,
                    avatar = model.avatar,
                    AvatarFile = model.AvatarFile
                };

                var accountUpdateResult = await _accountService.UpdateAccountAsync(id, updatedAccount);

                return Ok("Account and personal info updated!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private string GenerateSecureToken()
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");
        }

        [HttpPost("forget_password")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var account = await _accountService.GetAccountByEmailAsync(request.Email);

                var oldTokens = await _context.PasswordResetToken
                    .Where(t => t.Email == request.Email.ToLower())
                    .ToListAsync();

                if (oldTokens.Any())
                {
                    _context.PasswordResetToken.RemoveRange(oldTokens);
                }

                var token = GenerateSecureToken();
                var resetToken = new PasswordResetTokenModel
                {
                    Id = Guid.NewGuid(),
                    Email = request.Email.ToLower(),
                    Token = token,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                    IsUsed = false
                };

                await _context.PasswordResetToken.AddAsync(resetToken);
                await _context.SaveChangesAsync();

                var frontendUrl = "http://localhost:5173";
                var resetUrl = $"{frontendUrl}/reset_password?token={token}";

                var emailBody = $@"
                <h2>Сброс пароля для Syncro</h2>
                <p>Вы запросили сброс пароля для вашего аккаунта.</p>
                <p>Для завершения процесса перейдите по ссылке:</p>
                <p><a href='{resetUrl}'>{resetUrl}</a></p>
                <p><strong>Ссылка действительна 15 минут.</strong></p>
                <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                <hr>
                <p style='color: #666; font-size: 12px;'>
                    Это письмо отправлено автоматически. Пожалуйста, не отвечайте на него.
                </p>";

                await _emailService.SendEmailAsync(
                    request.Email,
                    "Сброс пароля Syncro",
                    emailBody);

                _logger.LogInformation($"Password reset token generated for {request.Email}");

                return Ok(new { message = "Если учетная запись существует, на email отправлена инструкция" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning($"Password reset requested for non-existing email: {request.Email}");
                return StatusCode(404, "Почта не найдена");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ForgetPassword");
                return StatusCode(500, "Произошла внутренняя ошибка сервера");
            }
        }

        [HttpGet("validate_reset_token/{token}")]
        public async Task<IActionResult> ValidateResetToken(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { message = "Токен не указан" });
                }

                var resetToken = await _context.PasswordResetToken
                    .FirstOrDefaultAsync(t =>
                        t.Token == token &&
                        !t.IsUsed &&
                        t.ExpiresAt > DateTime.UtcNow);

                if (resetToken == null)
                {
                    return NotFound(new { message = "Ссылка для сброса пароля недействительна или истекла" });
                }

                return Ok(new
                {
                    email = resetToken.Email,
                    valid = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token");
                return StatusCode(500, "Произошла внутренняя ошибка сервера");
            }
        }

        [HttpPost("reset_password")]
        public async Task<IActionResult> ResetPassword([FromBody] Application.ModelsDTO.ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var resetToken = await _context.PasswordResetToken
                    .Where(t => t.Token == request.Token && !t.IsUsed)
                    .FirstOrDefaultAsync();

                if (resetToken == null)
                {
                    return BadRequest(new { message = "Ссылка для сброса пароля недействительна" });
                }

                if (resetToken.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Ссылка для сброса пароля истекла" });
                }

                var account = await _accountService.GetAccountByEmailAsync(resetToken.Email);
                if (account == null)
                {
                    return BadRequest(new { message = "Пользователь не найден" });
                }

                var result = await _accountService.ResetPassword(account.Id, request.NewPassword);
                if (result is null)
                {
                    throw new Exception("Failed to reset password");
                }

                resetToken.IsUsed = true;
                _context.PasswordResetToken.Update(resetToken);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                var confirmationBody = $@"
                <h2>Пароль успешно изменен</h2>
                <p>Пароль для вашего аккаунта Syncro был успешно изменен.</p>
                <p>Если это были не вы, немедленно свяжитесь со службой поддержки.</p>
                <hr>
                <p style='color: #666; font-size: 12px;'>
                    Это письмо отправлено автоматически.
                </p>";

                await _emailService.SendEmailAsync(
                    resetToken.Email,
                    "Пароль успешно изменен - Syncro",
                    confirmationBody);

                _logger.LogInformation($"Password successfully reset for {resetToken.Email}");

                return Ok(new { message = "Пароль успешно изменен" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, "Произошла внутренняя ошибка сервера");
            }
        }

         // POST: api/accounts/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                Response.Cookies.Delete("access-token", new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (Guid.TryParse(userId, out var accountId))
                {
                    await _accountService.Logout(accountId);
                }
                
                return Ok(new { 
                    Success = true, 
                    Message = "Logged out successfully" 
                });
            }
            catch (Exception ex)
            {
                Response.Cookies.Delete("access-token");
                
                return StatusCode(500, new { 
                    Success = false, 
                    Error = "Internal server error",
                    Message = ex.Message 
                });
            }
        }
    }
}