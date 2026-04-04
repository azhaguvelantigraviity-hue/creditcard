import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('sbiToken');
            if (token) {
                try {
                    const { data } = await api.get('/auth/profile');
                    setUser(data);
                } catch (error) {
                    console.error('Auth verification failed', error);
                    localStorage.removeItem('sbiToken');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('sbiToken', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const faceLogin = async (descriptor) => {
        const { data } = await api.post('/auth/face-login', { descriptor });
        localStorage.setItem('sbiToken', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('sbiToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, faceLogin, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
