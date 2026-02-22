import { PersonalChatProps } from "../../Types/ChatTypes";

const ChatComponent = ({ chatContent, nickname, avatar, isOnline, baseUrl }: PersonalChatProps) => {
    return (
        <div className="chat-container">
            {chatContent}
        </div>
    );
}

export default ChatComponent;