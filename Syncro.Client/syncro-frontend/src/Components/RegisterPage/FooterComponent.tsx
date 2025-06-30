import { Link } from 'react-router-dom'

const FooterComponent = () => {
    return (
        <div>
            <footer>
                <p>
                    Already have an account?&nbsp;
                    <Link to="/login" className='underline-element'> Sign in!</Link>
                </p>
                <p className="celebration">
                    &#127881; Thank you for choosing us!&nbsp;&#127881;
                </p>
            </footer>
        </div>
    );
}

export default FooterComponent;