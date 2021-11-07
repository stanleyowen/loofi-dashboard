import React, { useState, useEffect } from 'react'
import { Skeleton } from '@mui/material'

interface Song {
    title: string,
    author: string,
    image: string,
    playing: boolean,
    audio: HTMLAudioElement
}
interface Music {
    title: string,
    author: string,
    image: string,
    audio: HTMLAudioElement
}

interface Data {
    song: any,
    songData: Array<any>,
    handleSong: any
}

const Music = ({ song, songData, handleSong, HOST_DOMAIN }: any) => {
    const [greeting, setGreeting] = useState<string>()

    const triggerAudio = (e: React.MouseEvent<HTMLButtonElement>, data: any) => {
        e.preventDefault()
        if(song.playing) {
            handleSong({ id: 'playing', value: false })
            setTimeout(() => handleSong(data), 10)
        } else handleSong(data);
        (e.target as Element).classList.toggle('pause')
    }

    useEffect(() => {
        const currentHour = new Date().getHours()
        if(currentHour < 12) setGreeting('Morning')
        else if(currentHour < 18) setGreeting('Afternoon')
        else setGreeting('Evening')
    }, [])

    function SkeletonPreview(count: number, type: 'large' | 'small') {
        const skeleton = []
        for (let i=0; i<count; i++) {
            skeleton.push(
                type === 'small' ?
                    (<div className="m-10" key={i}>
                        <div className="card flex">
                            <Skeleton variant="rectangular" width={75} height={75} animation="wave" />
                            <p className="m-auto w-50">
                                <Skeleton variant="text" animation="wave" width="50%" />
                                <Skeleton variant="text" animation="wave" />
                            </p>
                        </div>
                    </div>) :
                    (<div className="m-10" key={i}>
                        <div className="large-card">
                            <Skeleton variant="circular" height={200} animation="wave" />
                            <div className="flex">
                                <span className="mt-10 w-70"><Skeleton variant="text" animation="wave" /></span>
                                <span className="w-40"><Skeleton variant="text" animation="wave" /></span>
                            </div>
                        </div>
                    </div>)
            )
        }
        return skeleton
    }

    return (
        <div>
            <h2 className="m-10">Music Component</h2>
            
        </div>
    )
}

export default Music