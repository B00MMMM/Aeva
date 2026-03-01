import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Play, Info } from 'lucide-react';
import './GameCard.css';

const GameCard = ({ game, rank }) => {
    const { formatPrice } = useContext(CurrencyContext);

    const hasSavings = game.cheapest < game.retailPrice;
    // Priority: Steam CDN capsule > Steam CDN header > steamInfo capsule > CheapShark thumb
    const imageSrc = game.steamImages?.capsule
        || game.steamImages?.header
        || game.steamInfo?.capsule_image
        || game.steamInfo?.header_image
        || game.thumb
        || 'https://via.placeholder.com/300x400?text=No+Image';
    const savings = game.savings ? Math.round(game.savings) : 0;

    return (
        <div className="game-card">
            {rank && <div className="game-rank">{rank}</div>}
            <div className="game-image-wrapper">
                <img src={imageSrc} alt={game.title} loading="lazy" />
                <div className="game-overlay">
                    <div className="game-overlay-content">
                        <h3 className="game-title">{game.title}</h3>
                        <div className="game-meta">
                            <span className="deal-rating">★ {game.dealRating || 'N/A'}</span>
                            <span className="price">{formatPrice(game.cheapest)}</span>
                        </div>

                        <div className="game-actions">
                            <Link to={`/info/${game.gameID || game.id}`} className="btn btn-primary">
                                <Info size={16} /> Details
                            </Link>
                            {game.dealID && (
                                <a
                                    href={`https://www.cheapshark.com/redirect?dealID=${game.dealID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                >
                                    <Play size={16} /> Get Deal
                                </a >
                            )}
                        </div >
                    </div >
                </div >
            </div >
            {savings > 0 && <div className="savings-badge">-{savings}%</div>}
        </div >
    );
};

export default GameCard;
