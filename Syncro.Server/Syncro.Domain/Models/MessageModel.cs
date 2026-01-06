namespace Syncro.Domain.Models
{
    public class MessageModel
    {
        public Guid Id { get; set; }
        public required string messageContent { get; set; }
        public DateTime messageDateSent { get; set; }
        public Guid? accountId { get; set; }
        public string? accountNickname { get; set; }
        public Guid? personalConferenceId { get; set; }
        public Guid? groupConferenceId { get; set; }
        public Guid? sectorId { get; set; }
        public bool isEdited { get; set; }
        public string? previousMessageContent { get; set; }
        public bool isPinned { get; set; }
        public bool isRead { get; set; }
        public Guid? referenceMessageId { get; set; }

        public string? MediaUrl { get; set; } // URL медиафайла в S3
        public MessageType? MediaType { get; set; } // Тип медиа (изображение, видео и т.д.)
        public string? FileName { get; set; } // имя файла

        public bool IsEncrypted { get; set; } = true; // По умолчанию все сообщения шифруются
        public byte[]? EncryptedContent { get; set; } // Зашифрованный контент
        public string? EncryptionMetadata { get; set; } // Метаданные шифрования (IV, chainId и т.д.)
        public int EncryptionVersion { get; set; } = 1; // Версия шифрования
    }
}