namespace Syncro.Infrastructure.Records
{
    public record FileUploadResult(
    string FileUrl,
    string FileName,
    string ContentType,
    long FileSize
);

    public record FileDownloadResult(
        Stream Stream,
        string ContentType,
        string FileName
    );
}
