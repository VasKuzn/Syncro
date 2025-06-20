import React from 'react';


type PropsType = {
    id: number
    name: string
    time: string
    message: string
}

const Message: React.FC<PropsType> = (props) => {
    return (
        <div onClick={() => alert(props.id)} className="messageItem">
            <div className="photo">
            </div>
            <div className="content">
                <span className="name">{props.name}</span>
                <time className="time">{props.time}</time>
                <p className="message">{props.message}</p>
            </div>
        </div>
    )
}

const MessageWithMemo = React.memo(Message)

export default MessageWithMemo