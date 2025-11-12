import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const storageKey = 'guestAuth';

const GuestAuthContext = createContext({
    guest: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    loginGuest: () => {},
    logoutGuest: () => {},
    updateGuest: () => {}
});

export const GuestAuthProvider = ({ children }) => {
    const [guest, setGuest] = useState(null);
    const [token, setToken] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);

    useEffect(() => {
        const persisted = localStorage.getItem(storageKey);
        if (persisted) {
            try {
                const parsed = JSON.parse(persisted);
                if (parsed?.token) {
                    setToken(parsed.token);
                    setGuest(parsed.guest ?? null);
                    setExpiresAt(parsed.expiresAt ?? null);
                }
            } catch (error) {
                localStorage.removeItem(storageKey);
            }
        }
    }, []);

    const persistState = (session) => {
        if (session) {
            localStorage.setItem(storageKey, JSON.stringify(session));
        } else {
            localStorage.removeItem(storageKey);
        }
    };

    const loginGuest = (authToken, guestProfile, expiration) => {
        const session = {
            token: authToken,
            guest: guestProfile,
            expiresAt: expiration ?? null
        };
        setToken(session.token);
        setGuest(session.guest);
        setExpiresAt(session.expiresAt);
        persistState(session);
    };

    const logoutGuest = () => {
        setToken(null);
        setGuest(null);
        setExpiresAt(null);
        persistState(null);
    };

    const updateGuest = (guestProfile) => {
        if (!token) {
            return;
        }
        const session = {
            token,
            guest: guestProfile,
            expiresAt
        };
        setGuest(guestProfile);
        persistState(session);
    };

    const value = useMemo(() => ({
        guest,
        token,
        expiresAt,
        isAuthenticated: Boolean(token),
        loginGuest,
        logoutGuest,
        updateGuest
    }), [guest, token, expiresAt]);

    return (
        <GuestAuthContext.Provider value={value}>
            {children}
        </GuestAuthContext.Provider>
    );
};

export const useGuestAuth = () => useContext(GuestAuthContext);
