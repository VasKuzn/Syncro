const GroupChatsComponent = () => {
    return (
        <div className="group-chats">
            <div className="main-logo">
                <img src="/logo.png" alt="Syncro logo" width="50" height="50" />
            </div>
            <div className="chat-separator"></div>
            <div className="group-chat-list">
                <div className="group-chat-item">ГЧ</div>
                <div className="group-chat-item">ГЧ</div>
            </div>
            <div className="group-chat-item add">+</div>
        </div>
    );
}

export default GroupChatsComponent