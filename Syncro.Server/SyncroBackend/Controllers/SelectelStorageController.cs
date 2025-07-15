using Amazon.S3;

[ApiController]
[Route("api/storage")]
public class StorageController : ControllerBase
{
    private readonly ISelectelStorageService _storageService;

    public StorageController(ISelectelStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file, string path = "")
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required");

        var keyName = GenerateKeyName(file.FileName, path);

        try
        {
            var result = await _storageService.UploadFile(file, keyName);
            return Ok(new { KeyName = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("upload-big")]
    public async Task<IActionResult> UploadBigFile(IFormFile file, string path = "")
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required");

        var keyName = GenerateKeyName(file.FileName, path);

        try
        {
            var result = await _storageService.UploadBigFile(
                file,
                keyName,
                progress => Console.WriteLine($"Current progress: {progress}%")
            );
            return Ok(new { KeyName = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("download/{keyName}")]
    public async Task<IActionResult> DownloadFile(string keyName, string path = "")
    {
        if (string.IsNullOrEmpty(keyName))
            return BadRequest("Key name is required");

        try
        {
            var fullPath = CombinePath(path, keyName);
            var stream = await _storageService.DownloadFileAsync(fullPath);
            return File(stream, "application/octet-stream", keyName);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpDelete("{keyName}")]
    public async Task<IActionResult> DeleteFile(string keyName, string path = "")
    {
        if (string.IsNullOrEmpty(keyName))
            return BadRequest("Key name is required");

        try
        {
            var fullPath = CombinePath(path, keyName);
            await _storageService.DeleteFileAsync(fullPath);
            return NoContent();
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    private string GenerateKeyName(string fileName, string path)
    {
        var extension = Path.GetExtension(fileName);
        var ulid = Ulid.NewUlid().ToString();
        var keyName = $"{ulid}{extension}";

        return string.IsNullOrEmpty(path)
            ? keyName
            : $"{path.TrimEnd('/')}/{keyName}";
    }

    private string CombinePath(string path, string keyName)
    {
        return string.IsNullOrEmpty(path)
            ? keyName
            : $"{path.TrimEnd('/')}/{keyName}";
    }
}