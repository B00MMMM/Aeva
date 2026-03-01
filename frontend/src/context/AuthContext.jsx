import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api/auth';

    useEffect(() => {
        const token = localStorage.getItem('aeva_token');
        const userData = localStorage.getItem('aeva_user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const getAuthHeader = () => {
        const token = localStorage.getItem('aeva_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            localStorage.setItem('aeva_token', res.data.token);
            localStorage.setItem('aeva_user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return true;
        } catch (error) {
            console.error('Login Failed', error);
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await axios.post(`${API_URL}/register`, { username, email, password });
            localStorage.setItem('aeva_token', res.data.token);
            localStorage.setItem('aeva_user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return true;
        } catch (error) {
            console.error('Registration Failed', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('aeva_token');
        localStorage.removeItem('aeva_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, getAuthHeader }}>
            {children}
        </AuthContext.Provider>
    );
};
