import { MainProps } from "../../Types/MainProps";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";


const BodyComponent = ({ friends, nickname, avatar, isOnline}: MainProps) => {
    return (
        <div className="body-container">
            <SidebarComponent 
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
             />
            <FriendsComponent friends={friends} />
        </div>
    );
}

export default BodyComponent;