import BodyComponent from "./BodyComponent";
import { MainProps } from "../../Types/MainProps";

const MainComponent = ({ friends, nickname, avatar, isOnline, setFriends, baseUrl, csrfToken }: MainProps & { setFriends: (friends: any) => void }) => {
    return (
        <div className="main-page">
            <BodyComponent
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}
                setFriends={setFriends}
                baseUrl={baseUrl}
                csrfToken={csrfToken} />
        </div>
    );
};

export default MainComponent;