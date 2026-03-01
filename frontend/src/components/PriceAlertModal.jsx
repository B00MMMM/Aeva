import { useState } from 'react';
import './PriceAlertModal.css';
import { Bell, X } from 'lucide-react';

const PriceAlertModal = ({ isOpen, onClose, currentPrice, existingAlert, onSetAlert, onRemoveAlert }) => {
    const [targetPrice, setTargetPrice] = useState(existingAlert?.targetPrice || '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) return;
        onSetAlert(price);
        onClose();
    };

    const handleRemove = () => {
        onRemoveAlert();
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={22} />
                </button>
                <div className="modal-header">
                    <Bell size={28} className="modal-icon" />
                    <h3>Price Drop Alert</h3>
                </div>

                <p className="modal-subtext">
                    Get notified when this game drops to your target price.
                </p>

                <div className="modal-current-price">
                    <span className="label">Current Best Price</span>
                    <span className="value">${currentPrice}</span>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="modal-input-group">
                        <label>Your Target Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 4.99"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary modal-btn">
                        {existingAlert ? 'Update Alert' : 'Set Alert'}
                    </button>
                </form>

                {existingAlert && (
                    <button className="btn btn-outline modal-remove-btn" onClick={handleRemove}>
                        Remove Alert
                    </button>
                )}
            </div>
        </div>
    );
};

export default PriceAlertModal;
