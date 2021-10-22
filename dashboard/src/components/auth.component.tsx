import React, { useState, useEffect } from 'react'
import { getFirestore, addDoc, collection } from "firebase/firestore"
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { Button } from '@mui/material'
import { randomBytes } from 'crypto'

async function generateToken(admin: string) {
    randomBytes(132, (err, byte) => {
        const token:string = byte.toString('hex')
        setTokenToCloud(admin, token)
        setTokenToLocal(token)
    })
}

async function setTokenToCloud(
    admin: string,
    token: string
) {
    await addDoc(collection(getFirestore(), "token"), {
        admin, token
    });
}

async function setTokenToLocal(token: string) {
    let expires = ""
    const date = new Date()
    date.setTime(date.getTime() + 24*3600*1000)
    expires = "; expires=" + date.toUTCString()
    document.cookie = `token = ${token || ""} ${expires}; path=/`
}

const About = ({ config, handleCredential }: any) => {
    useEffect(() => {
        initializeApp(config)
        getRedirectResult(getAuth())
        .then((result) => {
            console.log(result)
            if(result && result.user.email === process.env.REACT_APP_ADMIN_EMAIL) {
                // handleCredential(true)
                generateToken(result.user.email)
            }
        })
        .catch(err => console.log(err))
    }, [])

    return (
        <div className="bg-white container p-10 rounded-corner">
            <h3 className="center-align">Loofi Dashboard</h3>
            <Button
                variant="outlined"
                className="mt-10"
                onClick={() => {
                    signInWithRedirect(getAuth(), new GoogleAuthProvider())
                }
            }>
                Sign in with Google
            </Button>
        </div>
    )
}

export default About