import { PersonalChatProps } from "../../Types/ChatTypes";
import ChatComponent from "./ChatComponent";
import SidebarComponent from "../MainPage/SidebarComponent";

const BodyComponent = ({ chatContent, friends = [] }: PersonalChatProps) => {
  return (
    <div className="body-container">
      <SidebarComponent friends={friends} />
      <ChatComponent chatContent={chatContent} />
    </div>
  );
};

export default BodyComponent;