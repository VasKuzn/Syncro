import { Link } from 'react-router-dom'

const FooterComponent = () => {
    return (
        <div>
            <footer>
                <div>
                    <p>
                        Want to synchronize?&nbsp;
                        <Link to="/register" className='underline-element'>Sign up!</Link>
                    </p>
                    <ul>
                        <li><a href="#" className='underline-element'>Privacy policy</a></li>
                        <li><a href="#" className='underline-element'>Community Guidelines</a></li>
                        <li><a href="#" className='underline-element'>Cookie policy</a></li>
                        <li><a href="#" className='underline-element'>Copyright policy</a></li>
                    </ul>
                </div>
            </footer>
        </div>
    );
}

export default FooterComponent;