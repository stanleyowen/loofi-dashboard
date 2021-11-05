import React from 'react';
import { randomBytes } from 'crypto';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

function setCookie(name: string, value: string) {
    let expires = '';
    const date = new Date();
    date.setTime(date.getTime() + 24 * 3600 * 1000);
    expires = '; expires=' + date.toUTCString();
    process.env.NODE_ENV === 'production'
        ? (document.cookie = `__Secure-${name} = ${value} ${expires}; path=/; secure`)
        : (document.cookie = `${name} = ${value} ${expires}; path=/;`);
    location.href = '/';
}

export const generateToken = (email: string) => {
    randomBytes(132, (err, byte) => {
        const token: string = byte.toString('hex');
        setTokenToCloud(email, token);
    });
};

export const setTokenToCloud = (email: string, token: string) => {
    setDoc(
        doc(getFirestore(), 'loofi-dashboard', `${email.split('@')[0]}-token`),
        {
            email,
            token,
        }
    ).then(() => setTokenToLocal(email, token));
};

export const setTokenToLocal = (email: string, token: string) => {
    setCookie('email', email);
    setCookie('token', token);
};

export const getTokenValue = (name: string) => {
    const cookieName =
        process.env.NODE_ENV === 'production'
            ? `__Secure-${name}=`
            : `${name}=`;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let data = cookies[i];
        while (data.charAt(0) === ' ') data = data.substring(1, data.length);
        if (data.indexOf(cookieName) === 0)
            return data.substring(cookieName.length, data.length);
    }
    return null;
};
