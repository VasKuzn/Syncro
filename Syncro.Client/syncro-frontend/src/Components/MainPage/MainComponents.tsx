import HeaderComponent from "./HeaderComponent";
import BodyComponent from "./BodyComponent";
import { FriendProps } from "../../Types/FriendType";


const MainComponent = ({ friends }: FriendProps) => {
    return (
        <div className="main-page">
            <HeaderComponent></HeaderComponent>
            <BodyComponent
                friends={friends}>
            </BodyComponent>
        </div>
    );
};

export default MainComponent;