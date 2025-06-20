import React from "react";
import GroupChatsComponent from "./GroupChatsComponent";
import PersonalChatsComponent from "./PersonalChatsComponent";
import { Friend } from "../../Types/FriendType";

interface SidebarComponentProps{
    friends: Friend[]
}

const SidebarComponent: React.FC<SidebarComponentProps> = ({friends}) => {
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