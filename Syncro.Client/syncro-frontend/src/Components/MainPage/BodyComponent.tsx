import { FriendProps } from "../../Types/FriendType";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";


const BodyComponent = ({ friends }: FriendProps) => {
    return (
        <div className="body-container">
            <SidebarComponent friends={friends} />
            <FriendsComponent friends={friends} />
        </div>
    );
}

export default BodyComponent;