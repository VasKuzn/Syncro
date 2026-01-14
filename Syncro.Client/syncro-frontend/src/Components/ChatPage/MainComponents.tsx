import BodyComponent from "./BodyComponent";
import { PersonalChatProps } from "../../Types/ChatTypes";

const MainComponent = ({ chatContent, friends, nickname, avatar, isOnline }: PersonalChatProps) => {
  return (
    <div className="main-page">
      <BodyComponent chatContent={chatContent} friends={friends} nickname={nickname} avatar={avatar} isOnline={isOnline} />
    </div>
  );
};

export default MainComponent;