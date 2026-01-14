import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import ProfilePanelComponent from "./ProfilePanelComponent";
import { MainProps } from "../../Types/MainProps";

const SidebarComponent = ({ friends, nickname, avatar, isOnline, setFriends }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent />
            <div className="main-sidebar-content">
                <div className="search-pm">
                    <button className="button-search-pm">
                        Личные сообщения
                    </button>
                </div>
                <PersonalChatsComponent
                    friends={friends}
                    setFriends={setFriends} />
                <div className="profile-panel-wrapper">
                    <ProfilePanelComponent
                        nickname={nickname}
                        avatar={avatar}
                        isOnline={isOnline} />
                </div>
            </div>
        </div>
    );
}

export default SidebarComponent;