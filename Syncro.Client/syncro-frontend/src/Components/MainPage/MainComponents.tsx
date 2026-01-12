import BodyComponent from "./BodyComponent";
import { MainProps } from "../../Types/MainProps";

const MainComponent = ({ friends, nickname, avatar, isOnline, setFriends }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="main-page">
            <BodyComponent
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
                setFriends={setFriends}/>
        </div>
    );
};

export default MainComponent;