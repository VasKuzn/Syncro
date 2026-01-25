import { PersonalChatProps } from "../../Types/ChatTypes";
import ChatComponent from "./ChatComponent";
import SidebarComponent from "../MainPage/SidebarComponent";

const BodyComponent = ({ chatContent, friends = [], nickname, avatar, isOnline, setFriends }: PersonalChatProps & { setFriends: (friends: any) => void }) => {

  return (
    <div className="body-container">
      <SidebarComponent friends={friends} setFriends={setFriends} nickname={nickname} avatar={avatar} isOnline={isOnline} />
      <ChatComponent chatContent={chatContent} nickname={nickname} avatar={avatar} isOnline={isOnline} />
    </div>
  );
};

export default BodyComponent;