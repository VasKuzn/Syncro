import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import ProfilePanelComponent from "./ProfilePanelComponent";
import { MainProps } from "../../Types/MainProps";

const SidebarComponent = ({ friends, nickname, avatar, isOnline, setFriends }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent/>
            <PersonalChatsComponent
                friends={friends}
                setFriends={setFriends}/>
            <ProfilePanelComponent 
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}/>
        </div>
    );
}

export default SidebarComponent;