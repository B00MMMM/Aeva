import './DealCard.css';
import { ExternalLink } from 'lucide-react';

const DealCard = ({ deal, stores }) => {
    const store = stores?.find(s => s.storeID === deal.storeID);
    const storeIcon = store ? `https://www.cheapshark.com${store.images.icon}` : '';
    const storeName = store ? store.storeName : 'Store';

    const savings = Math.round(deal.savings);

    return (
        <div className="deal-card glass">
            <div className="deal-store-info">
                {storeIcon && <img src={storeIcon} alt={storeName} className="store-icon" />}
                <span className="store-name">{storeName}</span>
            </div>

            <div className="deal-price-info">
                <div className="price-tag">
                    <span className="current-price">${deal.price || deal.salePrice}</span>
                    {savings > 0 && <span className="retail-price">${deal.retailPrice}</span>}
                </div>
                {savings > 0 && <span className="deal-savings">-{savings}%</span>}
            </div>

            <a
                href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary get-deal-btn"
            >
                View Deal <ExternalLink size={14} />
            </a>
        </div>
    );
};

export default DealCard;
