import { MainProps } from "../../Types/MainProps";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";

const BodyComponent = ({ friends, nickname, avatar, isOnline, setFriends }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="body-container">
            <SidebarComponent 
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
                setFriends={setFriends}
             />
            <FriendsComponent 
                friends={friends} 
                setFriends={setFriends} 
            />
        </div>
    );
}

export default BodyComponent;