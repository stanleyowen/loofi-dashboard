import React, { useState, useEffect } from 'react';
import { generateToken } from '../lib/functions.component';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { Alert, Slide, Button, Snackbar, SlideProps } from '@mui/material';

type TransitionProps = Omit<SlideProps, 'direction'>;

const Auth = ({ handleCredential }: any) => {
    const whiteListedEmails: string[] | undefined =
        process.env.REACT_APP_WHITELISTED_EMAIL?.split(', ');
    const [status, setStatus] = useState<{
        isError: boolean;
        message:
            | null
            | 'Invalid Credentials'
            | 'Something Went Wrong. Please Try Again Later.'
            | 'No Whitelisted Emails are Found.';
    }>({
        isError: false,
        message: null,
    });
    const [transition, setTransition] = useState<
        React.ComponentType<TransitionProps> | undefined
    >(undefined);

    useEffect(() => {
        for (let i = 0; i < 79; i++) {
            const div = document.createElement('div');
            div.style.opacity = `${Math.random() * (0.075 - 0.025) + 0.025}`;
            document.querySelector('.backdrop-overlay')?.appendChild(div);
        }
    }, []);

    return (
        <div>
            <div className="backdrop-overlay"></div>
            <div className="backdrop">
                <div className="acrylic-material"></div>
                <div className="backdrop-image" id="backdrop-image"></div>
            </div>

            <div className="bg-white container p-10 rounded-corner">
                <h3 className="center-align mb-10">Welcome Back!</h3>
                <Button
                    variant="outlined"
                    className="mt-10 w-100"
                    onClick={() => {
                        signInWithPopup(getAuth(), new GoogleAuthProvider())
                            .then((result) => {
                                function Transition(props: TransitionProps) {
                                    return (
                                        <Slide {...props} direction="right" />
                                    );
                                }
                                setTransition(() => Transition);
                                if (result) {
                                    console.log(result);
                                    if (whiteListedEmails)
                                        whiteListedEmails.forEach(
                                            (email, index) => {
                                                if (
                                                    result.user.email === email
                                                ) {
                                                    generateToken(
                                                        result.user.email
                                                    );
                                                    handleCredential({
                                                        id: 'isLoading',
                                                        value: false,
                                                    });
                                                } else if (
                                                    index ===
                                                    whiteListedEmails.length - 1
                                                ) {
                                                    setStatus({
                                                        isError: true,
                                                        message:
                                                            'Invalid Credentials',
                                                    });
                                                    handleCredential({
                                                        id: 'isLoading',
                                                        value: false,
                                                    });
                                                }
                                            }
                                        );
                                    else {
                                        setStatus({
                                            isError: true,
                                            message:
                                                'No Whitelisted Emails are Found.',
                                        });
                                        setTimeout(
                                            () =>
                                                setStatus({
                                                    isError: false,
                                                    message: null,
                                                }),
                                            5000
                                        );
                                    }
                                } else {
                                    setStatus({
                                        isError: true,
                                        message:
                                            'Something Went Wrong. Please Try Again Later.',
                                    });
                                    setTimeout(
                                        () =>
                                            setStatus({
                                                isError: false,
                                                message: null,
                                            }),
                                        5000
                                    );
                                }
                            })
                            .catch(() => {
                                setStatus({
                                    isError: true,
                                    message:
                                        'Something Went Wrong. Please Try Again Later.',
                                });
                                setTimeout(
                                    () =>
                                        setStatus({
                                            isError: false,
                                            message: null,
                                        }),
                                    5000
                                );
                            });
                    }}
                >
                    Sign in with Google
                </Button>
            </div>

            <Snackbar open={status.isError} TransitionComponent={transition}>
                <Alert severity="error">{status.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default Auth;
