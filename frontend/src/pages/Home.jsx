import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GameCard from '../components/GameCard';
import './Home.css';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const API_URL = 'http://localhost:5000/api/games';

// Reusable ScrollRow component with side arrows
const ScrollRow = ({ children }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 600;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="scroll-row">
            <button className="scroll-arrow left" onClick={() => scroll('left')}>
                <ChevronLeft size={28} />
            </button>
            <div className="scroll-container" ref={scrollRef}>
                {children}
            </div>
            <button className="scroll-arrow right" onClick={() => scroll('right')}>
                <ChevronRight size={28} />
            </button>
        </div>
    );
};

const Home = () => {
    const [trendingDeals, setTrendingDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

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

    // Auto-scroll logic for hero section
    useEffect(() => {
        if (trendingDeals.length === 0) return;
        const maxIndex = Math.min(trendingDeals.length, 5);
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % maxIndex);
        }, 5000);
        return () => clearInterval(interval);
    }, [trendingDeals.length]);

    const handlePrevHero = () => {
        const maxIndex = Math.min(trendingDeals.length, 5);
        setCurrentHeroIndex((prev) => (prev === 0 ? maxIndex - 1 : prev - 1));
    };

    const handleNextHero = () => {
        const maxIndex = Math.min(trendingDeals.length, 5);
        setCurrentHeroIndex((prev) => (prev + 1) % maxIndex);
    };

    if (loading) {
        return <div className="loading-screen">Loading AEVA...</div>;
    }

    const heroGame = trendingDeals[currentHeroIndex] || {};
    const heroImage = heroGame.steamImages?.hero || heroGame.steamImages?.header || heroGame.thumb || 'https://via.placeholder.com/1920x1080?text=Hero+Image';

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section
                className="hero-section"
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <div className="hero-overlay">
                    <button className="hero-nav-btn prev" onClick={handlePrevHero}><ChevronLeft size={48} /></button>
                    <div className="hero-content" key={heroGame.dealID}>
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
                    <button className="hero-nav-btn next" onClick={handleNextHero}><ChevronRight size={48} /></button>
                </div>
            </section>

            {/* Top Content Row */}
            <section className="content-section">
                <h2 className="section-title"><span>TOP 10</span> CONTENT TODAY</h2>
                <ScrollRow>
                    {trendingDeals.slice(0, 10).map((game, index) => (
                        <GameCard key={game.dealID} game={game} rank={index + 1} />
                    ))}
                </ScrollRow>
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
                <ScrollRow>
                    {trendingDeals.slice(5, 15).map((game) => (
                        <GameCard key={game.dealID} game={game} />
                    ))}
                </ScrollRow>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
