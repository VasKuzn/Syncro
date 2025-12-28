import BodyComponent from "./BodyComponent";
import { MainProps } from "../../Types/MainProps";

const MainComponent = ({ friends, nickname, avatar, isOnline}: MainProps) => {
    return (
        <div className="main-page">
            <BodyComponent
                friends={friends}
                nickname={nickname}
                avatar={avatar}
                isOnline={isOnline}/>
        </div>
    );
};

export default MainComponent;