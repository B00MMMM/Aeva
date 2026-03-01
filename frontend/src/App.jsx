import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Home from './pages/Home';
import Info from './pages/Info';
import Search from './pages/Search';
import Tracked from './pages/Tracked';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/info/:id" element={<Info />} />
                <Route path="/search" element={<Search />} />
                <Route path="/tracked" element={<Tracked />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
