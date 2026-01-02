import { Link } from 'react-router-dom';
import './styles/notFound.css';

const NotFound = () => {
    return (
        <div className="not-found-wrapper">
            <div className="not-found-content">
                <h1 className="error-code">404</h1>
                <div className="error-title">Page Not Found</div>
                <p className="error-message">
                    Oops! The page you are looking for doesn't exist or has been moved. 
                    Let's get you back on track.
                </p>
                <Link to="/" className="home-btn">
                    <span>Back to Home</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;