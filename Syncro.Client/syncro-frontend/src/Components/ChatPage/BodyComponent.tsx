import { PersonalChatProps } from "../../Types/ChatTypes";
import ChatComponent from "./ChatComponent";
import SidebarComponent from "../MainPage/SidebarComponent";

const BodyComponent = ({ chatContent, friends = [], nickname, avatar, isOnline }: PersonalChatProps) => {
  const setFriendsStub = () => {
    //заглушка чтоб ошибки не было, спросить Юлю надо
  };

  return (
    <div className="body-container">
      <SidebarComponent friends={friends} setFriends={setFriendsStub} nickname={nickname} avatar={avatar} isOnline={isOnline} />
      <ChatComponent chatContent={chatContent} nickname={nickname} avatar={avatar} isOnline={isOnline} />
    </div>
  );
};

export default BodyComponent;