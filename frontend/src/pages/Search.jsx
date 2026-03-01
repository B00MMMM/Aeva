import { useState, useRef, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Search.css';
import { Search as SearchIcon, Loader, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { CurrencyContext } from '../context/CurrencyContext';
import { AuthContext } from '../context/AuthContext';

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/games`;

const Search = () => {
    const { user, getAuthHeader } = useContext(AuthContext) || {}; // fallback for safety
    const { formatPrice } = useContext(CurrencyContext);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Autocomplete State
    const [recentSearches, setRecentSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch user's recent searches on load
    useEffect(() => {
        if (!user) return;
        const fetchSearches = async () => {
            try {
                const headers = getAuthHeader();
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/user/searches`, { headers });
                setRecentSearches(data);
            } catch (err) {
                console.error('Error fetching recent searches:', err);
            }
        };
        fetchSearches();
    }, [user]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRemoveSearch = async (e, termToRemove) => {
        e.stopPropagation(); // prevent triggering the search click
        try {
            const headers = getAuthHeader();
            await axios.delete(`${import.meta.env.VITE_API_URL || ''}/api/user/searches/item`, {
                data: { term: termToRemove },
                headers
            });
            setRecentSearches(prev => prev.filter(t => t !== termToRemove));
        } catch (err) {
            console.error('Error removing search term:', err);
        }
    };

    const executeSearch = async (searchTerm) => {
        if (!searchTerm.trim()) return;

        setQuery(searchTerm); // Update input field
        setShowSuggestions(false);
        setLoading(true);
        setSearched(true);

        try {
            // Save search to Redis history (fire and forget)
            if (user) {
                const headers = getAuthHeader();
                axios.post(`${import.meta.env.VITE_API_URL || ''}/api/user/searches`, { term: searchTerm }, { headers }).catch(e => console.error(e));

                // Optimistically update local state if new
                if (!recentSearches.includes(searchTerm.toLowerCase())) {
                    setRecentSearches(prev => [searchTerm.toLowerCase(), ...prev].slice(0, 10));
                }
            }

            const { data } = await axios.get(`${API_URL}/search?term=${encodeURIComponent(searchTerm.trim())}`);
            setResults(data);
        } catch (error) {
            console.error('Error searching games:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        executeSearch(query);
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -400 : 400,
                behavior: 'smooth'
            });
        }
    };

    // Filter recent searches based on current input
    const filteredSuggestions = recentSearches.filter(s => s.includes(query.toLowerCase()));

    const topResult = results[0];
    const otherResults = results.slice(1);

    return (
        <div className="search-page">
            <div className="search-hero">
                <h1 className="search-heading">Search Games</h1>
                <p className="search-subtext">Find the best deals across multiple stores</p>
                <div className="search-container" ref={inputRef}>
                    <form className="search-form glass" onSubmit={handleSearch}>
                        <SearchIcon size={22} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for a game..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
                            {loading ? <Loader size={18} className="spin" /> : 'Search'}
                        </button>
                    </form>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && user && filteredSuggestions.length > 0 && (
                        <div className="autocomplete-dropdown glass">
                            <div className="autocomplete-header">Recent Searches</div>
                            {filteredSuggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    className="autocomplete-item"
                                    onClick={() => executeSearch(suggestion)}
                                >
                                    <div className="autocomplete-item-left">
                                        <SearchIcon size={14} className="autocomplete-item-icon" />
                                        <span>{suggestion}</span>
                                    </div>
                                    <button
                                        className="autocomplete-remove-btn"
                                        onClick={(e) => handleRemoveSearch(e, suggestion)}
                                        title="Remove from history"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="search-results-container">
                {loading && (
                    <div className="search-loading">
                        <Loader size={40} className="spin" />
                        <p>Searching games...</p>
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="search-empty">
                        <h3>No results found</h3>
                        <p>Try a different search term or check the spelling.</p>
                    </div>
                )}

                {!loading && topResult && (
                    <>
                        <h2 className="results-count">{results.length} game{results.length !== 1 ? 's' : ''} found</h2>

                        {/* Top Match — Full-width hero banner */}
                        <Link
                            to={`/info/${topResult.gameID}`}
                            className="top-match"
                            style={{
                                backgroundImage: `url(${topResult.steamImages?.screenshots?.[1]?.path_full || topResult.steamImages?.header || topResult.thumb})`
                            }}
                        >
                            <div className="top-match-overlay">
                                <div className="top-match-info">
                                    <span className="top-match-label">Best Match</span>
                                    <h2 className="top-match-title">{topResult.external}</h2>
                                    <div className="top-match-meta">
                                        <span className="top-match-price">Starting from {formatPrice(topResult.cheapest)}</span>
                                    </div>
                                    <span className="top-match-cta">
                                        View Details <ChevronRight size={18} />
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Other Results — Horizontal scroll cards like trending */}
                        {otherResults.length > 0 && (
                            <div className="search-scroll-section">
                                <h3 className="section-title">More Results</h3>
                                <div className="search-scroll-wrapper">
                                    <button className="scroll-arrow left" onClick={() => scroll('left')}>
                                        <ChevronLeft size={28} />
                                    </button>
                                    <div className="search-scroll-row" ref={scrollRef}>
                                        {otherResults.map((game) => {
                                            const capsule = game.steamImages?.capsule || game.steamImages?.header || game.thumb || 'https://via.placeholder.com/300x400';
                                            return (
                                                <div key={game.gameID} className="game-card">
                                                    <div className="game-image-wrapper">
                                                        <img src={capsule} alt={game.external} loading="lazy" />
                                                        <div className="game-overlay">
                                                            <div className="game-overlay-content">
                                                                <h3 className="game-title">{game.external}</h3>
                                                                <div className="game-meta">
                                                                    <span className="price">{formatPrice(game.cheapest)}</span>
                                                                </div>
                                                                <div className="game-actions">
                                                                    <Link to={`/info/${game.gameID}`} className="btn btn-primary">
                                                                        <Info size={16} /> Details
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button className="scroll-arrow right" onClick={() => scroll('right')}>
                                        <ChevronRight size={28} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Search;
