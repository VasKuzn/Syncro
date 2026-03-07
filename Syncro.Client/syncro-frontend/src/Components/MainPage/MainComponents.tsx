import BodyComponent from "./BodyComponent";
import { MainProps } from "../../Types/MainProps";
import NotificationPopup from './NotificationPopup';

const MainComponent = ({ friends, nickname, avatar, isOnline, setFriends }: MainProps & { setFriends: (friends: any) => void }) => {
    const notification = {
        chatName: 'Чатик',
        senderName: 'Анна',
        senderAvatar: '/logo.png', 
        message: 'Привет всем! Как дела? Аораорпоырвппппппоооооооооооооооооооооооооооооооооооо'
    };
    return (
        <div className="main-page">
            <BodyComponent
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
                setFriends={setFriends}/>
            <div>
                <NotificationPopup notification={notification} />
            </div>
        </div>
    );
};

export default MainComponent;