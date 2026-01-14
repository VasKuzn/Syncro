import { useNavigate } from 'react-router-dom';


const SidebarComponent = () => {
    const navigate = useNavigate();
    return (
        <div className="settings-sidebar">
            <div className="settings-pages-container">
                <div className="settings-header">Личный кабинет</div>
                <button className="settings-sidebar-button">
                    Моя учётная запись
                </button>
                <button className="settings-sidebar-button" onClick={e => navigate("/main")}>
                    Назад
                </button>
            </div>
        </div>
    );
}

export default SidebarComponent