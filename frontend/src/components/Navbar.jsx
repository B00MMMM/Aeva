import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, User as UserIcon, LogOut, Heart, Home as HomeIcon } from 'lucide-react';
import logo from '../assets/LOGO.png';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <Link to="/" className="nav-brand">
                    <img src={logo} alt="AEVA" className="nav-logo" />
                    <h1>AEVA</h1>
                </Link>

                <div className="nav-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
                    <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>Search</Link>
                    {user && (
                        <Link to="/tracked" className={location.pathname === '/tracked' ? 'active' : ''}>My Games</Link>
                    )}
                </div>

                <div className="nav-actions">
                    <Link to="/search" style={{ display: 'flex', alignItems: 'center' }}>
                        <Search size={20} style={{ cursor: 'pointer' }} color="#a0a0a0" />
                    </Link>
                    {user && (
                        <Link to="/tracked" style={{ display: 'flex', alignItems: 'center' }}>
                            <Heart size={20} style={{ cursor: 'pointer' }} color="#a0a0a0" />
                        </Link>
                    )}
                    {user ? (
                        <>
                            <span style={{ color: '#a0a0a0' }}>Welcome, {user.username}</span>
                            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%' }}>
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%' }}>
                            <UserIcon size={20} />
                        </Link>
                    )}
                </div>
            </nav>

            <div className="mobile-nav">
                <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <HomeIcon size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/search" className={`mobile-nav-item ${location.pathname === '/search' ? 'active' : ''}`}>
                    <Search size={24} />
                    <span>Search</span>
                </Link>
                {user && (
                    <Link to="/tracked" className={`mobile-nav-item ${location.pathname === '/tracked' ? 'active' : ''}`}>
                        <Heart size={24} />
                        <span>My Games</span>
                    </Link>
                )}
            </div>
        </>
    );
};

export default Navbar;
