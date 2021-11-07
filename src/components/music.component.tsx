import React, { useState, useEffect } from 'react'

interface Data {
    song: any,
    songData: Array<any>,
    handleSong: any
}

const Music = ({ song, songData, handleSong, HOST_DOMAIN }: any) => {
    return (
        <div>
            <h2 className="m-10">Music Component</h2>
            <div className="col-2">
                <div className="m-10">
                    <div className="card p-10">
                        <h2 className="center-align">
                            {songData.length === 0 ? '-' : songData.length }
                        </h2>
                        <p className="center-align">Musics</p>
                    </div>
                </div>
                <div className="m-10">
                    <div className="card p-10">
                        <h2 className="center-align">-</h2>
                        <p className="center-align">Musics</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Music