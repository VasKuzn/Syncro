import { PersonalMessageData } from '../../Types/ChatTypes';

const Message = ({
    id,
    messageContent,
    messageDateSent,
    accountId,
}: PersonalMessageData) => {
    // Преобразуем строку в объект Date
    const date = new Date(messageDateSent);
    // Форматируем время
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="messageItem">
            <div className="photo" />
            <div className="content">
                <div className="header">
                    <span className="name">{accountId}</span>
                    <time className="time">{formattedTime}</time>
                </div>
                <p className="message">{messageContent}</p>
            </div>
        </div>
    );
};

export default Message;