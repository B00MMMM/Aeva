import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import './Tracked.css';
import { Heart, Bell, Trash2, ExternalLink } from 'lucide-react';

const USER_API = 'http://localhost:5000/api/user';

const Tracked = () => {
    const { user, getAuthHeader } = useContext(AuthContext);
    const { formatPrice } = useContext(CurrencyContext);
    const [activeTab, setActiveTab] = useState('alerts');
    const [likedGames, setLikedGames] = useState([]);
    const [priceAlerts, setPriceAlerts] = useState([]);
    const [livePrices, setLivePrices] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const fetchTracked = async () => {
            try {
                const headers = getAuthHeader();
                const { data } = await axios.get(`${USER_API}/tracked`, { headers });
                setLikedGames(data.likedGames);
                setPriceAlerts(data.priceAlerts);

                // Fetch live prices for alerts to check if they are triggered
                if (data.priceAlerts && data.priceAlerts.length > 0) {
                    const pricePromises = data.priceAlerts.map(async (alert) => {
                        try {
                            // Using standard cheapshark API for quick lookup or our own cache
                            const res = await axios.get(`http://localhost:5000/api/games/${alert.gameID}`);
                            if (res.data && res.data.deals && res.data.deals.length > 0) {
                                return { gameID: alert.gameID, price: parseFloat(res.data.deals[0].price) };
                            }
                        } catch (e) {
                            console.error(`Failed to fetch live price for ${alert.gameID}`, e);
                        }
                        return { gameID: alert.gameID, price: null };
                    });

                    const results = await Promise.all(pricePromises);
                    const priceMap = {};
                    results.forEach(r => {
                        if (r.price !== null) priceMap[r.gameID] = r.price;
                    });
                    setLivePrices(priceMap);
                }

            } catch (err) {
                console.error('Error fetching tracked data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTracked();
    }, [user]);

    const handleRemoveAlert = async (gameID) => {
        try {
            const headers = getAuthHeader();
            await axios.delete(`${USER_API}/alert/${gameID}`, { headers });
            setPriceAlerts(prev => prev.filter(a => a.gameID !== gameID));
        } catch (err) {
            console.error('Error removing alert:', err);
        }
    };

    const handleUnlike = async (gameID) => {
        try {
            const headers = getAuthHeader();
            await axios.post(`${USER_API}/like`, { gameID }, { headers });
            setLikedGames(prev => prev.filter(g => g.gameID !== gameID));
        } catch (err) {
            console.error('Error unliking game:', err);
        }
    };

    if (!user) {
        return (
            <div className="tracked-page">
                <div className="tracked-empty">
                    <h2>Please log in to view your tracked games</h2>
                    <Link to="/login" className="btn btn-primary">Log In</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="loading-screen">Loading your games...</div>;
    }

    return (
        <div className="tracked-page">
            <div className="tracked-hero">
                <h1 className="tracked-heading">My Games</h1>
                <p className="tracked-subtext">Your liked games and price alerts in one place.</p>
            </div>

            <div className="tracked-tabs">
                <button className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                    <Bell size={18} /> Price Alerts ({priceAlerts.length})
                </button>
                <button className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`} onClick={() => setActiveTab('liked')}>
                    <Heart size={18} /> Liked Games ({likedGames.length})
                </button>
            </div>

            <div className="tracked-content">
                {activeTab === 'alerts' && (
                    <>
                        {priceAlerts.length === 0 ? (
                            <div className="tracked-empty-tab">
                                <Bell size={40} />
                                <h3>No price alerts set</h3>
                                <p>Visit a game's info page and click the bell icon to set an alert.</p>
                            </div>
                        ) : (
                            <div className="tracked-list">
                                {priceAlerts.map(alert => {
                                    const img = alert.steamAppID
                                        ? `https://cdn.akamai.steamstatic.com/steam/apps/${alert.steamAppID}/header.jpg`
                                        : alert.thumb;

                                    const currentPrice = livePrices[alert.gameID];
                                    const isTriggered = currentPrice !== undefined && currentPrice <= alert.targetPrice;

                                    return (
                                        <div key={alert.gameID} className={`tracked-card glass ${isTriggered ? 'alert-triggered' : ''}`}>
                                            <Link to={`/info/${alert.gameID}`} className="tracked-card-img">
                                                <img src={img} alt={alert.title} />
                                            </Link>
                                            <div className="tracked-card-info">
                                                <Link to={`/info/${alert.gameID}`} className="tracked-card-title">{alert.title}</Link>
                                                <div className="tracked-card-meta">
                                                    <span className="tracked-target">Target: <strong>{formatPrice(alert.targetPrice)}</strong></span>
                                                    {currentPrice !== undefined && (
                                                        <span className="tracked-current" style={{ marginLeft: '10px', color: isTriggered ? '#ff6a00' : 'inherit' }}>
                                                            Current: <strong>{formatPrice(currentPrice)}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="tracked-remove" onClick={() => handleRemoveAlert(alert.gameID)} title="Remove alert">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'liked' && (
                    <>
                        {likedGames.length === 0 ? (
                            <div className="tracked-empty-tab">
                                <Heart size={40} />
                                <h3>No liked games yet</h3>
                                <p>Visit a game's info page and click the heart icon to like it.</p>
                            </div>
                        ) : (
                            <div className="tracked-list">
                                {likedGames.map(game => {
                                    const img = game.steamAppID
                                        ? `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppID}/header.jpg`
                                        : game.thumb;
                                    return (
                                        <div key={game.gameID} className="tracked-card glass">
                                            <Link to={`/info/${game.gameID}`} className="tracked-card-img">
                                                <img src={img} alt={game.title} />
                                            </Link>
                                            <div className="tracked-card-info">
                                                <Link to={`/info/${game.gameID}`} className="tracked-card-title">{game.title}</Link>
                                            </div>
                                            <button className="tracked-remove" onClick={() => handleUnlike(game.gameID)} title="Unlike">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Tracked;
