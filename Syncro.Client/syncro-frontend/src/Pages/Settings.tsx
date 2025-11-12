import '../Styles/Settings.css';

import SidebarComponent from '../Components/SettingsPage/SidebarComponent';
import SettingsComponent from '../Components/SettingsPage/SettingsComponent';

const Settings = () => {
    return (
        <div className='settings-page'>
            <SidebarComponent/>
            <SettingsComponent/>
        </div>
    );
}

export default Settings;