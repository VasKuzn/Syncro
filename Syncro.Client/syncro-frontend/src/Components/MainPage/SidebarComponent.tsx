import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import { FriendProps } from "../../Types/FriendType";

const SidebarComponent = ({ friends }: FriendProps) => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent></GroupChatsComponent>
            <PersonalChatsComponent
                friends={friends}>
            </PersonalChatsComponent>
        </div>
    );
}

export default SidebarComponent;