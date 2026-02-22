import { MainProps } from "../../Types/MainProps";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";

const BodyComponent = ({ friends, nickname, avatar, isOnline, setFriends, baseUrl, csrfToken }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="body-container">
            <SidebarComponent
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
                setFriends={setFriends}
                baseUrl={baseUrl}
                csrfToken={csrfToken}
            />
            <FriendsComponent
                friends={friends}
                setFriends={setFriends}
                baseUrl={baseUrl}
                csrfToken={csrfToken}
            />
        </div>
    );
}

export default BodyComponent;