import { PersonalChatProps } from "../../Types/ChatTypes";

const ChatComponent = ({ chatContent }: PersonalChatProps) => {
    return (
        <div className="chat-container">
            {chatContent}
        </div>
    );
}

export default ChatComponent;