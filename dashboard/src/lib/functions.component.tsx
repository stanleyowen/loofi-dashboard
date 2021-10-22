import React from 'react'
import { randomBytes } from 'crypto'
import { getFirestore, addDoc, collection } from "firebase/firestore"

export const generateToken = (admin: string) => {
    randomBytes(132, (err, byte) => {
        const token:string = byte.toString('hex')
        setTokenToCloud(admin, token)
        setTokenToLocal(token)
    })
}

export const setTokenToCloud = (
    admin: string,
    token: string
) => {
    addDoc(collection(getFirestore(), "token"), {
        admin, token
    });
}

export const setTokenToLocal = (token: string) => {
    let expires = ""
    const date = new Date()
    date.setTime(date.getTime() + 24*3600*1000)
    expires = "; expires=" + date.toUTCString()
    document.cookie = `token = ${token || ""} ${expires}; path=/`
}

export const getTokenValue = () => {
    const cookieName = "token="
    const cookies = document.cookie.split(';')
    for(let i=0; i<cookies.length; i++) {
        let data = cookies[i]
        while (data.charAt(0) === ' ') data = data.substring(1, data.length)
        if(data.indexOf(cookieName) === 0) return data.substring(cookieName.length, data.length) 
    }
    return null
}