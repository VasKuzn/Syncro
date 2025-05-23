import React from 'react'
import {Link} from 'react-router-dom'

const FooterComponent = () => {
    return (
        <div>
            <footer>
                <p>
                    Already have an account?                        
                    <Link to="/" > Sign in!</Link>
                </p>
            </footer>
        </div>
    );
}

export default FooterComponent;