
const FriendsComponent = () => {
    return (
        <div className="friends">
            <div className="friends-nav">
                <label>Друзья</label>
                <button className="button-friends-status">В сети</button>
                <button className="button-friends-status">Все</button>
                <button className="button-friends-status add">Добавить в друзья</button>
            </div>
            <div className="friends-list">
                <h1>Друзья онлайн</h1>
            </div>
        </div>
    );
}

export default FriendsComponent;