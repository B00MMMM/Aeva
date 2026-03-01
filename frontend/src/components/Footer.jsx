import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import logo from '../assets/LOGO.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <img src={logo} alt="AEVA" className="footer-logo-img" />
                        <h3>AEVA</h3>
                    </div>
                    <p className="footer-tagline">Your ultimate game price comparison platform. Find the best deals across multiple stores.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Navigate</h4>
                        <Link to="/">Home</Link>
                        <Link to="/search">Search</Link>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Powered By</h4>
                        <a href="https://www.cheapshark.com" target="_blank" rel="noopener noreferrer">CheapShark API</a>
                        <a href="https://store.steampowered.com" target="_blank" rel="noopener noreferrer">Steam Store API</a>
                        <a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer">MongoDB Atlas</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>Made with <Heart size={14} fill="#ff6a00" color="#ff6a00" /> by AEVA Team &copy; {new Date().getFullYear()}</p>
            </div>
        </footer>
    );
};

export default Footer;
