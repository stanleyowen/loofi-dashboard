import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { generateToken } from '../lib/functions.component'
import { GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { Button } from '@mui/material'

const About = ({ config, handleCredential }: any) => {
    useEffect(() => {
        initializeApp(config)
        getRedirectResult(getAuth())
        .then((result) => {
            if(result) {
                if(result.user.email === process.env.REACT_APP_ADMIN_EMAIL) {
                    generateToken(result.user.email)
                    handleCredential({
                        isLoading: false,
                        loggedIn: true
                    })
                }else {
                    handleCredential({ id: 'isLoading', value: false })
                    return false
                }
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