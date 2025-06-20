import React from "react";
import HeaderComponent from "./HeaderComponent";
import BodyComponent from "./BodyComponent";
import { Friend } from "../../Types/FriendType";

interface MainComponentsProps {
    friends: Friend[]
}

const MainComponent: React.FC<MainComponentsProps> = ({friends}) => {
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