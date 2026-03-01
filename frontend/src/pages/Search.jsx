import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Search.css';
import { Search as SearchIcon, Loader, Star, ChevronRight } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/games';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const { data } = await axios.get(`${API_URL}/search?term=${encodeURIComponent(query.trim())}`);
            setResults(data);
        } catch (error) {
            console.error('Error searching games:', error);
        } finally {
            setLoading(false);
        }
    };

    const topResult = results[0];
    const otherResults = results.slice(1);

    return (
        <div className="search-page">
            <div className="search-hero">
                <h1 className="search-heading">Search Games</h1>
                <p className="search-subtext">Find the best deals across multiple stores</p>
                <form className="search-form glass" onSubmit={handleSearch}>
                    <SearchIcon size={22} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search for a game..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
                        {loading ? <Loader size={18} className="spin" /> : 'Search'}
                    </button>
                </form>
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
                        <h2 className="results-count">{results.length} game{results.length !== 1 ? 's' : ''} found for "{query}"</h2>

                        {/* Top Match — Full-Width Hero Card */}
                        <Link to={`/info/${topResult.gameID}`} className="top-match">
                            <div className="top-match-info">
                                <span className="top-match-label">Best Match</span>
                                <h2 className="top-match-title">{topResult.external}</h2>
                                <div className="top-match-meta">
                                    <span className="top-match-price">From ${topResult.cheapest}</span>
                                </div>
                                <span className="top-match-cta">
                                    View Details <ChevronRight size={18} />
                                </span>
                            </div>
                            <div className="top-match-cover">
                                <img
                                    src={topResult.steamImages?.header || topResult.thumb || 'https://via.placeholder.com/460x215'}
                                    alt={topResult.external}
                                />
                            </div>
                        </Link>

                        {/* Other Results — Vertical Scroll List */}
                        {otherResults.length > 0 && (
                            <div className="other-results">
                                <h3 className="other-results-heading">More Results</h3>
                                <div className="other-results-scroll">
                                    {otherResults.map((game) => {
                                        const image = game.steamImages?.header || game.thumb || 'https://via.placeholder.com/460x215';
                                        return (
                                            <Link to={`/info/${game.gameID}`} key={game.gameID} className="result-row glass">
                                                <img src={image} alt={game.external} className="result-row-img" />
                                                <div className="result-row-info">
                                                    <h4 className="result-row-title">{game.external}</h4>
                                                </div>
                                                <span className="result-row-price">From ${game.cheapest}</span>
                                                <ChevronRight size={20} className="result-row-arrow" />
                                            </Link>
                                        );
                                    })}
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
