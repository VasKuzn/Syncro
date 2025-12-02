import { MessageProps, PersonalMessageData } from '../../Types/ChatTypes';
import { getFileIconByType } from './FileIcon';
import ErrorBoundary from '../Common/ErrorBoundary';

const isString = (v: any): v is string => typeof v === 'string';

function detectMediaCategory(mediaTypeOrEnum?: string | number | null, fileName?: string | null) {
    if (!mediaTypeOrEnum && !fileName) return 'other';
    if (isString(mediaTypeOrEnum)) {
        const mt = mediaTypeOrEnum as string;
        if (mt.startsWith('image/')) return 'image';
        if (mt.startsWith('video/')) return 'video';
        if (mt.startsWith('audio/')) return 'audio';
        return 'other';
    }
    if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!ext) return 'other';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
        return 'other';
    }
    return 'other';
}

const MediaRenderer = ({ url, category, fileName }: { url: string; category: string; fileName?: string | null }) => {
    if (!url) return null;
    if (category === 'image') {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="media-preview">
                <img
                    src={url}
                    alt={fileName || 'media'}
                    style={{ objectFit: 'cover', borderRadius: 8, display: 'block' }}
                    onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
            </a>
        );
    }
    if (category === 'video') {
        return (
            <div className="media-file">
                <video controls className="media-video" style={{ borderRadius: 8 }}>
                    <source src={url} />
                    Ваш браузер не поддерживает видео.
                </video>
            </div>
        );
    }
    if (category === 'audio') {
        return (
            <div className="media-file">
                <audio controls className="media-audio">
                    <source src={url} />
                    Ваш браузер не поддерживает аудио.
                </audio>
            </div>
        );
    }
    return (
        <div className="media-file">
            {getFileIconByType(undefined, fileName || undefined)}
            <a href={url} download={fileName || undefined} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: 14, color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
                {fileName || 'Скачать файл'}
            </a>
        </div>
    );
};

const Message = ({
    messageContent,
    messageDateSent,
    accountNickname,
    mediaUrl,
    mediaType,
    fileName,
    isOwnMessage,
    avatarUrl
}: MessageProps) => {
    const date = new Date(messageDateSent);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isMedia = !!mediaUrl;
    const category = detectMediaCategory(mediaType, fileName);

    return (
        <ErrorBoundary>
            <div className={`messageItem ${isOwnMessage ? 'own-message' : 'friend-message'}`}>
                <div className="photo">
                    <img
                        src={avatarUrl}
                        alt={`${accountNickname} avatar`}
                        onError={(e) => {
                            e.currentTarget.src = './logo.png';
                        }} />
                </div>
                <div className="content">
                    <div className="header">
                        <span className="name">{accountNickname}</span>
                        <time className="time">{formattedTime}</time>
                    </div>
                    {isMedia ? (
                        <>
                            <MediaRenderer url={mediaUrl!} category={category} fileName={fileName} />
                            {category === 'image' && <div style={{ fontSize: 14, color: 'inherit', marginTop: 4 }}>{fileName}</div>}
                        </>
                    ) : (
                        <p className="message">{messageContent}</p>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Message;