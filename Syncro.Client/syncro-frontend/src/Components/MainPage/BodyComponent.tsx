import { Friend } from "../../Types/FriendType";
import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";

interface BodyComponentProps{
    friends: Friend[]
}

const BodyComponent: React.FC<BodyComponentProps> = ({friends}) => {
    return (
        <div className="body-container">
            <SidebarComponent
                friends={friends}
            >
            </SidebarComponent>
            <FriendsComponent 
                friends={friends}>
            </FriendsComponent>
        </div>
    );
}

export default BodyComponent;