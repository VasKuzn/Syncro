import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import { FriendProps } from "../../Types/FriendType";

const SidebarComponent = ({ friends, setFriends }: FriendProps) => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent></GroupChatsComponent>
            <PersonalChatsComponent
                friends={friends}
                setFriends={setFriends}>
            </PersonalChatsComponent>
        </div>
    );
}

export default SidebarComponent;