import { MessageProps } from '../../Types/ChatTypes';
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
const highlightTextMatches = (text: string, query?: string) => {
    if (!query || !text || query.trim() === '') {
        return text; // Возвращаем текст без изменений, если запроса нет
    }

    try {
        // Экранируем специальные символы для безопасного использования в RegExp
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

        return parts.map((part, index) => {
            if (part.toLowerCase() === query.toLowerCase()) {
                // Подсвечиваем совпадение
                return (
                    <mark key={index} className="message-search-highlight">
                        {part}
                    </mark>
                );
            }
            return part;
        });
    } catch (error) {
        // В случае ошибки в регулярном выражении возвращаем исходный текст
        console.warn('Ошибка при подсветке текста:', error);
        return text;
    }
};

const Message = ({
    messageContent,
    messageDateSent,
    accountNickname,
    mediaUrl,
    mediaType,
    fileName,
    isOwnMessage,
    avatarUrl,
    previousMessageAuthor,
    previousMessageDate,
    searchQuery // <-- Принимаем новый пропс здесь
}: MessageProps) => {
    const date = new Date(messageDateSent);
    const previousDate = previousMessageDate ? new Date(previousMessageDate) : null;

    let hideProfileInfo = false;

    if (previousMessageAuthor === accountNickname && previousDate) {
        const diffMs = date.getTime() - previousDate.getTime();
        const diffMinutes = diffMs / 1000 / 60;
        if (diffMinutes < 1) {
            hideProfileInfo = true;
        }
    }

    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isMedia = !!mediaUrl;
    const category = detectMediaCategory(mediaType, fileName);

    return (
        <ErrorBoundary>
            <div className={`messageItem ${isOwnMessage ? 'own-message' : 'friend-message'} ${hideProfileInfo ? 'no-profile' : ''}`}>
                {!hideProfileInfo && (
                    <div className="photo">
                        <img
                            src={avatarUrl}
                            alt={`${accountNickname} avatar`}
                            onError={(e) => {
                                e.currentTarget.src = './logo.png';
                            }} />
                    </div>
                )}
                <div className="content">
                    <div className="header">
                        {!hideProfileInfo && <span className="name">{accountNickname}</span>}
                    </div>
                    {isMedia ? (
                        <>
                            {messageContent && (
                                <div style={{ marginBottom: '6px' }}>
                                    {/* Подсветка текста в медиа-сообщениях */}
                                    {searchQuery ? highlightTextMatches(messageContent, searchQuery) : messageContent}
                                </div>
                            )}
                            <MediaRenderer url={mediaUrl!} category={category} fileName={fileName} />
                            {category === 'image' && <div style={{ fontSize: 14, color: 'inherit', marginTop: 4 }}></div>}
                        </>
                    ) : (
                        <p className="message">
                            {/* Подсветка текста в обычных сообщениях */}
                            {searchQuery ? highlightTextMatches(messageContent, searchQuery) : messageContent}
                            <time className="time">{formattedTime}</time>
                        </p>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Message;