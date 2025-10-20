using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Syncro.Application.SelectelStorage;
using Syncro.Domain.Records;
using System.Web;
namespace Syncro.Infrastructure.Selectel
{
    public class SelectelStorageService : ISelectelStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _cdnUrl;
        private readonly int _urlExpirationHours;

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
            _cdnUrl = configuration["S3Storage:CdnUrl"];
            _urlExpirationHours = configuration.GetValue<int>("S3Storage:UrlExpirationHours", 24);
        }

        public async Task<FileUploadResult> UploadMessageFileAsync(IFormFile file, Guid messageId, Guid? accountId, Guid? personalConferenceId)
        {
            ValidateFile(file);
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            var contentType = GetContentType(fileExtension);
            var folder = $"messages/{DateTime.UtcNow:yyyy/MM/dd}";
            var keyName = $"{folder}/{personalConferenceId}/{accountId}/{messageId}{fileExtension}";

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = keyName,
                InputStream = memoryStream,
                ContentType = contentType,
                CannedACL = S3CannedACL.PublicRead,
                Metadata =
            {
                ["original-filename"] = HttpUtility.UrlEncode(file.FileName)
            }
            };

            await _s3Client.PutObjectAsync(request);

            return new FileUploadResult(
                FileUrl: $"{_cdnUrl}/{keyName}",
                FileName: file.FileName,
                ContentType: contentType,
                FileSize: file.Length
            );
        }

        public async Task<string> GetTemporaryFileUrlAsync(string keyName)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = keyName,
                Expires = DateTime.UtcNow.AddHours(_urlExpirationHours),
                Protocol = Protocol.HTTPS
            };

            // Try to read metadata to preserve ContentType and original filename in the presigned URL
            string? contentType = null;
            string? originalFileName = null;
            try
            {
                var meta = await _s3Client.GetObjectMetadataAsync(_bucketName, keyName);
                contentType = meta.Headers.ContentType;
                // Metadata keys are available via indexer; check for existence
                if (meta.Metadata != null)
                {
                    // AmazonS3 SDK prepends user metadata keys with "x-amz-meta-" when returning headers
                    var keyCandidate = "x-amz-meta-original-filename";
                    foreach (var k in meta.Metadata.Keys)
                    {
                        var keyStr = k?.ToString() ?? string.Empty;
                        if (string.Equals(keyStr, keyCandidate, StringComparison.OrdinalIgnoreCase) || string.Equals(keyStr, "original-filename", StringComparison.OrdinalIgnoreCase))
                        {
                            originalFileName = HttpUtility.UrlDecode(meta.Metadata[keyStr]);
                            break;
                        }
                    }
                }
            }
            catch
            {
                // ignore metadata retrieval errors and fall back to default presigned URL
            }

            if (!string.IsNullOrEmpty(contentType) || !string.IsNullOrEmpty(originalFileName))
            {
                request.ResponseHeaderOverrides = new ResponseHeaderOverrides();
                if (!string.IsNullOrEmpty(contentType)) request.ResponseHeaderOverrides.ContentType = contentType;
                if (!string.IsNullOrEmpty(originalFileName)) request.ResponseHeaderOverrides.ContentDisposition = $"inline; filename=\"{originalFileName}\"";
            }

            return _s3Client.GetPreSignedURL(request);
        }

        public async Task DeleteMessageFilesAsync(Guid messageId, Guid personalConferenceId, Guid accountId)
        {
            var prefix = $"messages/{DateTime.UtcNow:yyyy/MM/dd}/{personalConferenceId}/{accountId}/{messageId}";
            var request = new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix
            };

            var response = await _s3Client.ListObjectsV2Async(request);

            foreach (var s3Object in response.S3Objects)
            {
                await _s3Client.DeleteObjectAsync(_bucketName, s3Object.Key);
            }
        }

        public async Task<FileDownloadResult> DownloadFileAsync(string keyName)
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = keyName
            };

            var response = await _s3Client.GetObjectAsync(request);

            return new FileDownloadResult(
                Stream: response.ResponseStream,
                ContentType: response.Headers.ContentType,
                FileName: response.Metadata["x-amz-meta-original-filename"] ?? keyName.Split('/').Last()
            );
        }

        private void ValidateFile(IFormFile file)
        {
            var maxFileSize = 25 * 1024 * 1024; // 25MB
            if (file.Length > maxFileSize)
            {
                throw new ArgumentException($"File size exceeds the limit of {maxFileSize / (1024 * 1024)}MB");
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm", ".mp3", ".ogg", ".pdf", ".doc", ".docx", ".xls", ".xlsx" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
            {
                throw new ArgumentException("File type not allowed");
            }
        }

        private string GetContentType(string fileExtension) => fileExtension switch
        {
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mp3" => "audio/mpeg",
            ".ogg" => "audio/ogg",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };
    }
}
