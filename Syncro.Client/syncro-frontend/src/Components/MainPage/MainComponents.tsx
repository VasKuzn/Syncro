import HeaderComponent from "./HeaderComponent";
import BodyComponent from "./BodyComponent";
import { FriendProps } from "../../Types/FriendType";


const MainComponent = ({ friends, setFriends }: FriendProps) => {
    return (
        <div className="main-page">
            <BodyComponent
                friends={friends} setFriends={setFriends} >
            </BodyComponent>
        </div>
    );
};

export default MainComponent;