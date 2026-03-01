import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DealCard from '../components/DealCard';
import './Info.css';
import { ArrowLeft, ExternalLink, Play, Expand } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/games';

const Info = () => {
    const { id } = useParams();
    const [gameData, setGameData] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeScreenshot, setActiveScreenshot] = useState(null);

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

    // Build hero image: prefer a full-res screenshot for a cinematic look
    const steamAppID = info.steamAppID;
    const firstScreenshot = steamInfo?.screenshots?.[0]?.path_full;
    const heroImage = firstScreenshot
        || steamInfo?.header_image
        || (steamAppID ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/header.jpg` : null)
        || steamInfo?.background
        || info.thumb;

    const screenshots = steamInfo?.screenshots || [];
    const movies = steamInfo?.movies || [];

    return (
        <div className="info-page">
            {/* Hero Section with background */}
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Trailers / Videos Section */}
            {movies.length > 0 && (
                <div className="media-section">
                    <h2 className="section-title">Trailers & Videos</h2>
                    <div className="videos-grid">
                        {movies.map((movie) => {
                            // Steam now provides HLS/DASH streams. Try to get a direct MP4 fallback url.
                            // Build a direct mp4 URL from Steam's CDN pattern
                            const videoSrc = movie.mp4?.max
                                || movie.mp4?.['480']
                                || movie.webm?.max
                                || movie.webm?.['480']
                                || null;
                            const hlsSrc = movie.hls_h264 || null;

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
                                            Your browser does not support the video tag.
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
                                            <ExternalLink size={14} /> View on Steam Store
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Deals Section */}
            <div className="deals-container">
                <h2 className="section-title">Available Deals</h2>
                <div className="deals-grid">
                    {deals.map(deal => (
                        <DealCard key={deal.dealID} deal={deal} stores={stores} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Info;
