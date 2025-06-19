import React from "react";
import HeaderComponent from "./HeaderComponent";
import BodyComponent from "./BodyComponent";

interface MainComponentsProps {

}

const MainComponent: React.FC<MainComponentsProps> = () => {


    return (
        <div className="main-page">
            <HeaderComponent></HeaderComponent>
            <BodyComponent></BodyComponent>
        </div>
    );
};

export default MainComponent;