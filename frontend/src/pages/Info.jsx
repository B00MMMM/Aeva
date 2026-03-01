import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DealCard from '../components/DealCard';
import PriceAlertModal from '../components/PriceAlertModal';
import './Info.css';
import { ArrowLeft, ExternalLink, Play, Expand, ChevronLeft, ChevronRight, Heart, Bell, ThumbsUp, ThumbsDown } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/games';
const USER_API = 'http://localhost:5000/api/user';

const Info = () => {
    const { id } = useParams();
    const { user, getAuthHeader } = useContext(AuthContext);
    const [gameData, setGameData] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeScreenshot, setActiveScreenshot] = useState(null);
    const videoScrollRef = useRef(null);

    // Like & Alert state
    const [liked, setLiked] = useState(false);
    const [alertData, setAlertData] = useState(null); // existing alert if any
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [priceAlertTriggered, setPriceAlertTriggered] = useState(false);

    useEffect(() => {
        const fetchGameInfo = async () => {
            try {
                const [gameRes, storesRes] = await Promise.all([
                    axios.get(`${API_URL}/${id}`),
                    axios.get(`${API_URL}/stores/list`)
                ]);

                setGameData(gameRes.data);
                setStores(storesRes.data);
            } catch (error) {
                console.error('Error fetching game info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGameInfo();
    }, [id]);

    // Fetch user like/alert status
    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            try {
                const headers = getAuthHeader();
                const { data } = await axios.get(`${USER_API}/tracked`, { headers });
                const isLiked = data.likedGames.some(g => g.gameID === id);
                setLiked(isLiked);
                const existing = data.priceAlerts.find(a => a.gameID === id);
                setAlertData(existing || null);
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };
        fetchUserData();
    }, [user, id]);

    // Check if price alert triggered
    useEffect(() => {
        if (alertData && gameData?.deals?.[0]) {
            const currentPrice = parseFloat(gameData.deals[0].price);
            if (currentPrice <= alertData.targetPrice) {
                setPriceAlertTriggered(true);
            }
        }
    }, [alertData, gameData]);

    const handleLike = async () => {
        if (!user) return;
        try {
            const { info, steamInfo } = gameData;
            const headers = getAuthHeader();
            const { data } = await axios.post(`${USER_API}/like`, {
                gameID: id,
                title: info.title,
                thumb: info.thumb,
                steamAppID: info.steamAppID
            }, { headers });
            setLiked(data.liked);
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    const handleSetAlert = async (targetPrice) => {
        if (!user) return;
        try {
            const { info } = gameData;
            const headers = getAuthHeader();
            await axios.post(`${USER_API}/alert`, {
                gameID: id,
                title: info.title,
                thumb: info.thumb,
                steamAppID: info.steamAppID,
                targetPrice
            }, { headers });
            setAlertData({ gameID: id, targetPrice });
        } catch (err) {
            console.error('Error setting alert:', err);
        }
    };

    const handleRemoveAlert = async () => {
        if (!user) return;
        try {
            const headers = getAuthHeader();
            await axios.delete(`${USER_API}/alert/${id}`, { headers });
            setAlertData(null);
            setPriceAlertTriggered(false);
        } catch (err) {
            console.error('Error removing alert:', err);
        }
    };

    const scrollVideos = (direction) => {
        if (videoScrollRef.current) {
            videoScrollRef.current.scrollBy({
                left: direction === 'left' ? -400 : 400,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return <div className="loading-screen">Loading Game Details...</div>;
    }

    if (!gameData || !gameData.info) {
        return (
            <div className="error-screen">
                <h2>Game not found</h2>
                <Link to="/" className="btn btn-primary">Return Home</Link>
            </div>
        );
    }

    const { info, deals, steamInfo } = gameData;
    const cheapestDeal = deals[0];

    // Build hero image
    const steamAppID = info.steamAppID;
    const firstScreenshot = steamInfo?.screenshots?.[0]?.path_full;
    const heroImage = firstScreenshot
        || steamInfo?.header_image
        || (steamAppID ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/header.jpg` : null)
        || steamInfo?.background
        || info.thumb;

    const screenshots = steamInfo?.screenshots || [];
    const movies = steamInfo?.movies || [];
    const recommendations = steamInfo?.recommendations;

    return (
        <div className="info-page">
            {/* Price Alert Triggered Popup */}
            {priceAlertTriggered && (
                <div className="alert-popup">
                    <div className="alert-popup-content glass">
                        <Bell size={22} />
                        <div>
                            <strong>Price Drop Alert!</strong>
                            <p>{info.title} is now ${cheapestDeal?.price} — at or below your target of ${alertData?.targetPrice}!</p>
                        </div>
                        <button className="alert-popup-close" onClick={() => setPriceAlertTriggered(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div
                className="info-hero"
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <div className="info-overlay">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={20} /> Back to Games
                    </Link>
                    <div className="info-content">
                        <h1 className="info-title">{info.title}</h1>
                        {steamInfo && (
                            <div className="steam-metadata">
                                <div className="steam-badges-row">
                                    {steamInfo.genres && (
                                        <div className="steam-genres">
                                            {steamInfo.genres.map(g => <span key={g.id} className="genre-badge">{g.description}</span>)}
                                        </div>
                                    )}
                                    {steamInfo.release_date && (
                                        <span className="release-date">📅 {steamInfo.release_date.date}</span>
                                    )}
                                    {steamInfo.metacritic && (
                                        <span className="metacritic-badge">Metacritic: {steamInfo.metacritic.score}</span>
                                    )}
                                </div>
                                <p className="steam-description">{steamInfo.short_description}</p>
                            </div>
                        )}
                        <div className="info-meta">
                            <span className="info-price">Starting from ${cheapestDeal?.price}</span>
                            {user && (
                                <div className="info-user-actions">
                                    <button className={`action-btn like-btn ${liked ? 'active' : ''}`} onClick={handleLike} title={liked ? 'Unlike' : 'Like'}>
                                        <Heart size={22} fill={liked ? '#ff6a00' : 'none'} color={liked ? '#ff6a00' : '#fff'} />
                                    </button>
                                    <button className={`action-btn alert-btn ${alertData ? 'active' : ''}`} onClick={() => setShowAlertModal(true)} title="Set Price Alert">
                                        <Bell size={22} fill={alertData ? '#ff6a00' : 'none'} color={alertData ? '#ff6a00' : '#fff'} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Price Alert Modal */}
            <PriceAlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                currentPrice={cheapestDeal?.price}
                existingAlert={alertData}
                onSetAlert={handleSetAlert}
                onRemoveAlert={handleRemoveAlert}
            />

            {/* Deals Section */}
            <div className="deals-container">
                <h2 className="section-title">Available Deals</h2>
                <div className="deals-list">
                    {deals.map(deal => (
                        <DealCard key={deal.dealID} deal={deal} stores={stores} layout="row" />
                    ))}
                </div>
            </div>

            {/* Steam Reviews Section */}
            {recommendations && (
                <div className="media-section">
                    <h2 className="section-title">Steam Reviews</h2>
                    <div className="reviews-card glass">
                        <div className="reviews-stat">
                            <ThumbsUp size={28} className="reviews-icon positive" />
                            <div>
                                <span className="reviews-number">{recommendations.total.toLocaleString()}</span>
                                <span className="reviews-label">Total Reviews</span>
                            </div>
                        </div>
                        {steamInfo.review_score_desc && (
                            <div className="reviews-verdict">
                                <span className={`verdict-badge ${steamInfo.review_score_desc.toLowerCase().includes('positive') ? 'positive' : 'mixed'}`}>
                                    {steamInfo.review_score_desc}
                                </span>
                            </div>
                        )}
                        <a
                            href={`https://store.steampowered.com/app/${steamAppID}#app_reviews_hash`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reviews-link"
                        >
                            Read Reviews on Steam <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            )}

            {/* Trailers / Videos Section */}
            {movies.length > 0 && (
                <div className="media-section">
                    <h2 className="section-title">Trailers & Videos</h2>
                    <div className="video-scroll-wrapper">
                        <button className="video-scroll-btn left" onClick={() => scrollVideos('left')}>
                            <ChevronLeft size={28} />
                        </button>
                        <div className="video-scroll-container" ref={videoScrollRef}>
                            {movies.map((movie) => {
                                const videoSrc = movie.mp4?.max || movie.mp4?.['480'] || movie.webm?.max || null;

                                return (
                                    <div key={movie.id} className="video-card glass">
                                        {videoSrc ? (
                                            <video
                                                controls
                                                poster={movie.thumbnail}
                                                preload="none"
                                                className="video-player"
                                            >
                                                <source src={videoSrc} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <a
                                                href={`https://store.steampowered.com/app/${steamAppID}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="video-link-card"
                                            >
                                                <img src={movie.thumbnail} alt={movie.name} className="video-thumbnail" />
                                                <div className="video-play-overlay">
                                                    <Play size={50} fill="white" />
                                                    <span>Watch on Steam</span>
                                                </div>
                                            </a>
                                        )}
                                        <div className="video-info">
                                            <h4>{movie.name}</h4>
                                            <a
                                                href={`https://store.steampowered.com/app/${steamAppID}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="steam-link"
                                            >
                                                <ExternalLink size={14} /> Steam
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="video-scroll-btn right" onClick={() => scrollVideos('right')}>
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>
            )}

            {/* Screenshots Section */}
            {screenshots.length > 0 && (
                <div className="media-section">
                    <h2 className="section-title">Screenshots</h2>
                    {activeScreenshot && (
                        <div className="screenshot-lightbox" onClick={() => setActiveScreenshot(null)}>
                            <img src={activeScreenshot} alt="Full Screenshot" />
                        </div>
                    )}
                    <div className="screenshots-grid">
                        {screenshots.map((ss, idx) => (
                            <div
                                key={idx}
                                className="screenshot-card"
                                onClick={() => setActiveScreenshot(ss.path_full)}
                            >
                                <img src={ss.path_thumbnail} alt={`Screenshot ${idx + 1}`} loading="lazy" />
                                <div className="screenshot-overlay">
                                    <Expand size={30} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Requirements */}
            {steamInfo?.pc_requirements?.minimum && (
                <div className="media-section">
                    <h2 className="section-title">System Requirements</h2>
                    <div className="sysreq-card glass">
                        <div dangerouslySetInnerHTML={{ __html: steamInfo.pc_requirements.minimum }} />
                        {steamInfo.pc_requirements.recommended && (
                            <div dangerouslySetInnerHTML={{ __html: steamInfo.pc_requirements.recommended }} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Info;
