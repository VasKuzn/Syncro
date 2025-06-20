import ChatComponent from "./ChatComponent";
import SidebarComponent from "./SidebarComponent";

interface BodyProps {
  chatContent?: React.ReactNode;
}

const BodyComponent: React.FC<BodyProps> = ({ chatContent }) => {
  return (
    <div className="body-container">
        <SidebarComponent />
        <ChatComponent chatContent={chatContent} />
    </div>
  );
};

export default BodyComponent;