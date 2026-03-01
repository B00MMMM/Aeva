import { useState, useEffect } from 'react';
import axios from 'axios';
import GameCard from '../components/GameCard';
import './Home.css';
import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/games';

const Home = () => {
    const [trendingDeals, setTrendingDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/trending`);
                setTrendingDeals(data);
            } catch (error) {
                console.error('Error fetching trending deals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    if (loading) {
        return <div className="loading-screen">Loading AEVA...</div>;
    }

    const heroGame = trendingDeals[0] || {};

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section
                className="hero-section"
                style={{ backgroundImage: `url(${heroGame.thumb || 'https://via.placeholder.com/1920x1080?text=Hero+Image'})` }}
            >
                <div className="hero-overlay">
                    <div className="hero-content">
                        <div className="hero-badges">
                            <span className="badge rating">★ {heroGame.dealRating || 'N/A'}</span>
                            {heroGame.savings > 0 && <span className="badge savings">-{Math.round(heroGame.savings)}%</span>}
                        </div>
                        <h1 className="hero-title">{heroGame.title || 'Welcome to AEVA'}</h1>
                        <p className="hero-description">
                            Discover the best game deals across multiple stores. AEVA brings you the ultimate price comparison experience with a stunning interface.
                        </p>
                        <div className="hero-actions">
                            {heroGame.gameID && (
                                <Link to={`/info/${heroGame.gameID}`} className="btn btn-primary btn-large">
                                    <Play size={20} fill="currentColor" /> View Game Details
                                </Link>
                            )}
                            {heroGame.dealID && (
                                <a
                                    href={`https://www.cheapshark.com/redirect?dealID=${heroGame.dealID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-large"
                                >
                                    <Info size={20} /> Get Deal Now
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Top Content Row */}
            <section className="content-section">
                <h2 className="section-title"><span>TOP 10</span> CONTENT TODAY</h2>
                <div className="scroll-container">
                    {trendingDeals.slice(0, 10).map((game, index) => (
                        <GameCard key={game.dealID} game={game} rank={index + 1} />
                    ))}
                </div>
            </section>

            {/* Trending Deals Row */}
            <section className="content-section">
                <div className="section-header">
                    <h2 className="section-title"><span style={{ color: 'var(--primary)', marginRight: '8px' }}>|</span> Trending Deals</h2>
                    <div className="section-tabs">
                        <span className="active">Games</span>
                        <span>DLCs</span>
                    </div>
                </div>
                <div className="scroll-container">
                    {trendingDeals.slice(5, 15).map((game) => (
                        <GameCard key={game.dealID} game={game} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
