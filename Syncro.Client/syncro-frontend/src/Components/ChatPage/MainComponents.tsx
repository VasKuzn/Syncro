import BodyComponent from "./BodyComponent";
import { PersonalChatProps } from "../../Types/ChatTypes";

const MainComponent = ({ chatContent, friends, nickname, avatar, isOnline, setFriends }: PersonalChatProps  & { setFriends: (friends: any) => void }) => {
  return (
    <div className="main-page">
      <BodyComponent chatContent={chatContent} friends={friends} setFriends={setFriends} nickname={nickname} avatar={avatar} isOnline={isOnline} />
    </div>
  );
};

export default MainComponent;