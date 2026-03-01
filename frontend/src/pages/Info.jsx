import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DealCard from '../components/DealCard';
import './Info.css';
import { ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/games';

const Info = () => {
    const { id } = useParams();
    const [gameData, setGameData] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const { info, deals } = gameData;
    const cheapestDeal = deals[0];

    return (
        <div className="info-page">
            {/* Hero Section */}
            <div className="info-hero" style={{ backgroundImage: `url(${info.thumb || 'https://via.placeholder.com/1920x1080'})` }}>
                <div className="info-overlay">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={20} /> Back to Games
                    </Link>
                    <div className="info-content">
                        <h1 className="info-title">{info.title}</h1>
                        <div className="info-meta">
                            <span className="info-price">Starting from ${cheapestDeal?.price}</span>
                        </div>
                    </div>
                </div>
            </div>

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
