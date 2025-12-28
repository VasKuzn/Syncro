import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import ProfilePanelComponent from "./ProfilePanelComponent";
import { MainProps } from "../../Types/MainProps";

const SidebarComponent = ({ friends, nickname, avatar, isOnline}: MainProps) => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent/>
            <PersonalChatsComponent
                friends={friends}/>
            <ProfilePanelComponent 
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}/>
        </div>
    );
}

export default SidebarComponent;