using Syncro.Application.TransferModels;
using Syncro.Infrastructure.Exceptions;
using Syncro.Infrastructure.JWT;
using System.IdentityModel.Tokens.Jwt;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IPersonalAccountInfoService _infoService;

        private readonly IEmailService _emailService;

        public AccountController(IAccountService accountService, IPersonalAccountInfoService infoService, IEmailService emailService)
        {
            _accountService = accountService;
            _infoService = infoService;
            _emailService = emailService;
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
        // GET: api/accounts/{email}
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
        // Мб потом убрать
        // GET: api/accounts/{id}/nickname
        [HttpGet("{userId}/nickname")]
        public async Task<ActionResult<string>> GetNickname(Guid userId)
        {
            var account = await _accountService.GetAccountByIdAsync(userId);
            if (account == null)
            {
                return StatusCode(404, $"Account not found error: ID {userId}");
            }
            return Ok(account.nickname);
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
                return StatusCode(404, $"User unauthorized error: {result.Error}");
            }
            catch (Exception)
            {
                return StatusCode(404, $"Аккаунт с таким email не найден");
            }

        }
        // POST: api/accounts/current - получение accountid из jwt выданного
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

        [HttpPost("forget_password")]
        public async Task<IActionResult> ForgetPassword([FromBody] Application.ModelsDTO.ForgetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return StatusCode(400, $"Bad request error: {ModelState}");
            }
            try
            {
                var resultToken = await _accountService.GetTokenForgetPassword(request.Email);

                var forgetToken = resultToken.Value;

                var callbackUrl = Url.Action(nameof(ResetPassword), nameof(AccountController).Replace("Controller", string.Empty), new { token = forgetToken }, protocol: HttpContext.Request.Scheme);

                var result = await _emailService.SendEmailAsync(request.Email, "Сброс пароля Syncro", "Для сброса пароля перейдите по ссылке: " + (callbackUrl as string) + ". Если это не вы, то ни в коем случае не переходите по ссылке!");

                return Ok($"Reset password message sent");
            }
            catch (ArgumentException aex)
            {
                return Ok($"Reset password message sent");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("reset_password/{token}")]
        public async Task<IActionResult> ResetPassword(string? token, [FromBody] Application.ModelsDTO.ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return StatusCode(400, $"Bad request error: {ModelState}");
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();

                var jwt = handler.ReadJwtToken(token);

                var idString = jwt.Claims.FirstOrDefault(x => x.Type == "nameid")?.Value;

                var id = Guid.Parse(idString);

                var account = await _accountService.GetAccountByIdAsync(id);

                var result = await _accountService.ResetPassword(account.Id, request.Password);

                return Ok($"Password reset");
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


    }
}