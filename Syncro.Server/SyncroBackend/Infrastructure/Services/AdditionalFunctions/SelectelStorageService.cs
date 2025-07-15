using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;

public class SelectelStorageService : ISelectelStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public SelectelStorageService(IConfiguration configuration)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = configuration["S3Storage:ServiceURL"],
            ForcePathStyle = true,
            AuthenticationRegion = configuration["S3Storage:Region"]
        };

        _s3Client = new AmazonS3Client(
            configuration["S3Storage:AccessKey"],
            configuration["S3Storage:SecretKey"],
            config
        );

        _bucketName = configuration["S3Storage:BucketName"];
    }

    public async Task<string> UploadFile(IFormFile file, string keyName)
    {
        using MemoryStream memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = keyName,
            InputStream = memoryStream,
            UseChunkEncoding = false
        };

        await _s3Client.PutObjectAsync(request);
        return keyName;
    }

    public async Task<string> UploadBigFile(IFormFile file, string keyName, Action<int> progressCallback = null)
    {
        var fileTransferUtility = new TransferUtility(_s3Client);

        using MemoryStream memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);

        var fileTransferUtilityRequest = new TransferUtilityUploadRequest
        {
            BucketName = _bucketName,
            Key = keyName,
            InputStream = memoryStream,
            StorageClass = S3StorageClass.StandardInfrequentAccess,
            PartSize = 6291456, // 6 MB
            CannedACL = S3CannedACL.PublicRead
        };

        if (progressCallback != null)
        {
            fileTransferUtilityRequest.UploadProgressEvent += (s, e) =>
            {
                progressCallback?.Invoke(e.PercentDone);
            };
        }

        await fileTransferUtility.UploadAsync(fileTransferUtilityRequest);
        return keyName;
    }

    public async Task<Stream> DownloadFileAsync(string keyName)
    {
        var request = new GetObjectRequest
        {
            BucketName = _bucketName,
            Key = keyName
        };

        var response = await _s3Client.GetObjectAsync(request);
        return response.ResponseStream;
    }

    public async Task DeleteFileAsync(string keyName)
    {
        var request = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = keyName
        };

        await _s3Client.DeleteObjectAsync(request);
    }
}

public interface ISelectelStorageService
{
    Task<string> UploadFile(IFormFile file, string keyName);
    Task<string> UploadBigFile(IFormFile file, string keyName, Action<int> progressCallback = null);
    Task<Stream> DownloadFileAsync(string keyName);
    Task DeleteFileAsync(string keyName);
}