import React from "react";

interface ChatComponentProps {
    chatContent?: React.ReactNode;
}


const ChatComponent: React.FC<ChatComponentProps> = ({ chatContent }) => {
    return (
        <div className="chat-container">
            {chatContent}
        </div>
    );
}

export default ChatComponent;