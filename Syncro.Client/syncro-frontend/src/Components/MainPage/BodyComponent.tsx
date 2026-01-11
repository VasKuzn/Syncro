import { FriendProps } from "../../Types/FriendType";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";


const BodyComponent = ({ friends, setFriends }: FriendProps) => {
    return (
        <div className="body-container">
            <SidebarComponent friends={friends} setFriends={setFriends} />
            <FriendsComponent friends={friends} setFriends={setFriends} />
        </div>
    );
}

export default BodyComponent;