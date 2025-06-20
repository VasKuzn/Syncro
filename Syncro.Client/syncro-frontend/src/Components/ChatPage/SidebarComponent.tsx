import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";

const SidebarComponent = () => {
    return (
        <div className="sidebar-container">
            <GroupChatsComponent></GroupChatsComponent>
            <PersonalChatsComponent></PersonalChatsComponent>
        </div>
    );
}

export default SidebarComponent;