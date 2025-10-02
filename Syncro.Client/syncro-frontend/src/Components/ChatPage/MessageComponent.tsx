import { PersonalMessageData } from '../../Types/ChatTypes';
import { getFileIconByType } from './FileIcon';


const Message = ({
    messageContent,
    messageDateSent,
    accountNickname,
    mediaUrl,
    mediaType,
    fileName
}: PersonalMessageData) => {
    const date = new Date(messageDateSent);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let isImagePreview = false;
    if (mediaType && fileName && mediaUrl) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        isImagePreview = mediaType.startsWith('image/') && ['png', 'jpg', 'jpeg'].includes(ext || '');
    }
    const isMedia = !!mediaUrl;
    return (
        <div className="messageItem">
            <div className="photo" />
            <div className="content">
                <div className="header">
                    <span className="name">{accountNickname}</span>
                    <time className="time">{formattedTime}</time>
                </div>
                {isMedia ? (
                    isImagePreview ? (
                        <div className="media-preview">
                            <a href={mediaUrl!} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={mediaUrl!}
                                    alt={fileName || 'media'}
                                    style={{ maxWidth: 200, maxHeight: 100, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                                    onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            </a>
                            <div style={{ fontSize: 14, color: 'inherit', marginTop: 4 }}>{fileName}</div>
                        </div>
                    ) : (
                        <div className="media-file">
                            {getFileIconByType(mediaType || undefined, fileName || undefined)}
                            <a
                                href={mediaUrl!}
                                download={fileName || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: 8, fontSize: 14, color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                            >
                                {fileName || 'Скачать файл'}
                            </a>
                        </div>
                    )
                ) : (
                    <p className="message">{messageContent}</p>
                )}
            </div>
        </div>
    );
};

export default Message;