import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, check for existing token and validate with /me
    useEffect(() => {
        const stored = localStorage.getItem('bm_token');
        if (!stored) {
            setIsLoading(false);
            return;
        }
        api.setToken(stored);
        api.get('/auth/me')
            .then(userData => {
                setUser(userData);
                setToken(stored);
                setIsAuthenticated(true);
            })
            .catch(() => {
                // Token invalid or expired
                api.clearToken();
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback((newToken, userData) => {
        localStorage.setItem('bm_token', newToken);
        api.setToken(newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('bm_token');
        localStorage.removeItem('token'); // clear legacy key too
        api.clearToken();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const updateUser = useCallback((partialUser) => {
        setUser(prev => ({ ...prev, ...partialUser }));
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
