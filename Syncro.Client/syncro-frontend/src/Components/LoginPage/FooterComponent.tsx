import React from 'react'
import {Link} from 'react-router-dom'

const FooterComponent = () => {
    return (
        <div>
            <footer>
                <div>
                    <p>
                        Want to synchronize?                        
                        <Link to="/register" >Sign up!</Link>
                    </p>                 
                    <ul>
                        <li><a href="#">Privacy policy</a></li>
                        <li><a href="#">Community Guidelines</a></li>
                        <li><a href="#">Cookie policy</a></li>
                        <li><a href="#">Copyright policy</a></li>
                    </ul>
                </div>
            </footer>
        </div>
    );
}

export default FooterComponent;