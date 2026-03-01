import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Gamepad2, Search, User as UserIcon, LogOut } from 'lucide-react';

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
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <Link to="/" className="nav-brand">
                <Gamepad2 color="#f83a3a" size={32} />
                <h1>AEVA</h1>
            </Link>

            <div className="nav-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
                <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>Search</Link>
            </div>

            <div className="nav-actions">
                <Link to="/search" style={{ display: 'flex', alignItems: 'center' }}>
                    <Search size={20} style={{ cursor: 'pointer' }} color="#a0a0a0" />
                </Link>
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
    );
};

export default Navbar;
