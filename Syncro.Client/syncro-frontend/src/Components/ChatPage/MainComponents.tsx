import React from "react";
import HeaderComponent from "./HeaderComponent";
import BodyComponent from "./BodyComponent";


interface MainComponentsProps {
  chatContent?: React.ReactNode;
}

const MainComponent: React.FC<MainComponentsProps> = ({ chatContent }) => {
  return (
    <div className="main-page">
      <HeaderComponent />
      <BodyComponent chatContent={chatContent} />
    </div>
  );
};

export default MainComponent;