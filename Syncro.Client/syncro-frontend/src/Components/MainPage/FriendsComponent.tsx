import { Friend } from "../../Types/FriendType";
import { NetworkError } from "../../Types/LoginTypes";

interface FriendsComponentProps {
    friends: Friend[],
}

const FriendsComponent: React.FC<FriendsComponentProps> = ({friends}) => {

    const inputBox: HTMLInputElement = document.getElementById("add-friend");

    const getUserByNickname = async (nickname: string) => {
        try {
            const response = await fetch(`http://localhost:5232/api/accounts/${nickname}/getnick`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

            return response.json();
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');          
        }
    }

    const addFriend = async () => {
        try {
            let now = Date.now();
            let timestamp = new Date(now);
            let user = await getUserByNickname(inputBox.value);
            let request = {userWhoSent: localStorage.getItem("id"), userWhoRecieved: user["id"], status: 1, friendsSince: timestamp.toISOString()}
            console.log(request);
            const response = await fetch(`http://localhost:5232/api/Friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');
        }
    }

    return (
        <div className="friends">
            <div className="friends-nav">
                <label>Друзья</label>
                <button className="button-friends-status">
                    В сети
                </button>
                <button className="button-friends-status">
                    Все
                </button>
                <button className="button-friends-status">
                    Заявки в друзья
                </button>
                <div className="input-container">
                    <div className="input-box">
                        <input id="add-friend" className="friends-search" placeholder="Введите почту друга"></input>
                    </div>
                </div>                
                <button className="button-friends-status add"
                    onClick={addFriend}>
                    Добавить в друзья
                </button>
            </div>

            <div className="friends-list">
                <div className="input-container">
                    <div className="input-box">
                        <input className="friends-search" placeholder="Поиск"></input>
                        <img className="search-icon" src="search-icon" alt=""></img>
                    </div>
                </div>
                
                <div className="friends-container">
                    {friends.map(friend => (
                        <div key={friend.id} className="friend-item">
                            <div className="friend-info-container">
                                <div className="friend-avatar-container">
                                    <img className="friend-avatar" src={friend.avatar}></img>
                                </div>
                                <div className="friend-text-info">
                                    <label className="nickname">{friend.nickname}</label>
                                    <label className="online-status">{friend.isOnline ? "В сети" : "Не в сети"}</label>
                                </div>  
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default FriendsComponent;