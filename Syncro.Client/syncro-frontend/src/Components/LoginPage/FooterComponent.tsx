import React from 'react'

const FooterComponent = () => {
    return (
        <div>
            <footer>
                <div>
                    <p>
                        Want to synchronize?
                        <a href="register.html" id="join-element">Sign up!</a>
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