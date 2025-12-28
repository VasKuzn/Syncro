import BodyComponent from "./BodyComponent";
import { PersonalChatProps } from "../../Types/ChatTypes";

const MainComponent = ({ chatContent, friends }: PersonalChatProps) => {
  return (
    <div className="main-page">
      <BodyComponent chatContent={chatContent} friends={friends} />
    </div>
  );
};

export default MainComponent;