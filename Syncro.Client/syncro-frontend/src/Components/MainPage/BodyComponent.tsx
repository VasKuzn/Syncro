import FriendsComponent from "./FriendsComponent";
import SidebarComponent from "./SidebarComponent";

const BodyComponent = () => {
    return (
        <div className="body-container">
            <SidebarComponent></SidebarComponent>
            <FriendsComponent></FriendsComponent>
        </div>
    );
}

export default BodyComponent;