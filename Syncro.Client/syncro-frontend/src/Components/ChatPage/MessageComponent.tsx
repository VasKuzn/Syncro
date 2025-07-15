import React from 'react';
import { MessageData } from '../../Types/ChatTypes';

const Message = (props: MessageData) => {
    return (
        <div onClick={() => alert(props.id)} className="messageItem">
            <div className="photo" />
            <div className="content">
                <div className="header">
                    <span className="name">{props.name}</span>
                    <time className="time">{props.time}</time>
                </div>
                <p className="message">{props.message}</p>
            </div>
        </div>
    )
}

const MessageWithMemo = React.memo(Message)

export default MessageWithMemo