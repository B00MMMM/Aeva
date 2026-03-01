import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD');
    const [rate, setRate] = useState(1);
    const [symbol, setSymbol] = useState('$');

    useEffect(() => {
        const initCurrency = async () => {
            try {
                // 1. Get user region and currency code
                const geoRes = await axios.get('https://ipapi.co/json/');
                const userCurrency = geoRes.data.currency || 'USD';

                if (userCurrency === 'USD') return;

                // 2. Get live exchange rate from USD
                const rateRes = await axios.get('https://open.er-api.com/v6/latest/USD');
                if (rateRes.data && rateRes.data.rates[userCurrency]) {
                    setCurrency(userCurrency);
                    const currentRate = rateRes.data.rates[userCurrency];
                    setRate(currentRate);

                    // Extract local currency symbol cleanly
                    const parts = new Intl.NumberFormat(geoRes.data.languages?.split(',')[0] || 'en-US', {
                        style: 'currency',
                        currency: userCurrency,
                    }).formatToParts(0);

                    const sym = parts.find(p => p.type === 'currency')?.value || userCurrency;
                    setSymbol(sym);

                    // Cache to avoid hitting API limits on reload
                    localStorage.setItem('aeva_currency', JSON.stringify({
                        currency: userCurrency,
                        rate: currentRate,
                        symbol: sym,
                        timestamp: Date.now()
                    }));
                }
            } catch (err) {
                console.error("Currency fetch failed. Defaulting to USD.", err);
            }
        };

        // Check cache first (24h expiry)
        const cachedStr = localStorage.getItem('aeva_currency');
        if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                setCurrency(cached.currency);
                setRate(cached.rate);
                setSymbol(cached.symbol);
                return;
            }
        }

        initCurrency();
    }, []);

    // Formats a USD price string/number into local currency formatted string
    const formatPrice = (usdPrice) => {
        if (!usdPrice || isNaN(usdPrice)) return 'N/A';
        const converted = parseFloat(usdPrice) * rate;

        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
        }).format(converted);
    };

    // Helper to accept a local currency input and convert back to USD (for backend saving)
    const convertToUSD = (localPrice) => {
        if (!localPrice || isNaN(localPrice)) return 0;
        return (parseFloat(localPrice) / rate).toFixed(2);
    };

    // Helper to get raw numerical local price
    const convertToLocal = (usdPrice) => {
        if (!usdPrice || isNaN(usdPrice)) return 0;
        return (parseFloat(usdPrice) * rate).toFixed(2);
    };

    return (
        <CurrencyContext.Provider value={{ currency, rate, symbol, formatPrice, convertToUSD, convertToLocal }}>
            {children}
        </CurrencyContext.Provider>
    );
};
