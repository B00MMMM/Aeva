import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import GameCard from '../components/GameCard';
import './Search.css';
import { Search as SearchIcon, Loader } from 'lucide-react';

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
            const { data } = await axios.get(`${API_URL}/deals?title=${encodeURIComponent(query.trim())}`);
            setResults(data);
        } catch (error) {
            console.error('Error searching games:', error);
        } finally {
            setLoading(false);
        }
    };

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

            {/* Results */}
            <div className="search-results-container">
                {loading && (
                    <div className="search-loading">
                        <Loader size={40} className="spin" />
                        <p>Searching deals...</p>
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="search-empty">
                        <h3>No results found</h3>
                        <p>Try a different search term or check the spelling.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <h2 className="results-count">{results.length} deal{results.length !== 1 ? 's' : ''} found for "{query}"</h2>
                        <div className="search-results-grid">
                            {results.map((game) => (
                                <GameCard key={game.dealID} game={game} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Search;
