namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        // GET: api/accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountModel>>> GetAllAccounts()
        {
            try
            {
                var accounts = await _accountService.GetAllAccountsAsync();
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/accounts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AccountModel>> GetAccountById(Guid id)
        {
            try
            {
                var account = await _accountService.GetAccountByIdAsync(id);
                return Ok(account);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/accounts/{email}
        [HttpGet("{email}/get")]
        public async Task<ActionResult<AccountModel>> GetAccountByEmail(string email)
        {
            try
            {
                var account = await _accountService.GetAccountByEmailAsync(email);
                return Ok(account);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/accounts/{email}
        [HttpGet("{nickname}/getnick")]
        public async Task<ActionResult<AccountModel>> GetAccountByNickname(string nickname)
        {
            try
            {
                var account = await _accountService.GetAccountByNicknameAsync(nickname);
                return Ok(account);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
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
            if (account == null) return NotFound();
            return Ok(account.nickname);
        }
        //
        // POST: api/accounts
        [HttpPost]
        public async Task<ActionResult<AccountModel>> CreateAccount([FromBody] AccountModel account)
        {
            try
            {
                var createdAccount = await _accountService.CreateAccountAsync(account);
                return CreatedAtAction(nameof(GetAccountById), new { id = createdAccount.Id }, createdAccount);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
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
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
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
                    return NotFound($"Account with id {id} not found");
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
                return BadRequest(ModelState);
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
                return Unauthorized(new { Error = result.Error });
            }
            catch (Exception)
            {
                return StatusCode(404, new { Error = "Аккаунт с таким email не найден" });
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
    }
}