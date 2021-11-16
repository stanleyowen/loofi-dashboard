import React from 'react';

import Home from './home.component';
import Music from './music.component';
import Settings from './settings.component';

// eslint-disable-next-line
const BaseLayout = ({
    song,
    properties,
    songData,
    handleSong,
    HOST_DOMAIN,
    rawSongData,
}: any) => {
    return (
        <div className="base">
            {properties.activeTab === 'home' ? (
                <Home
                    properties={properties}
                    handleSong={handleSong}
                    song={song}
                    songData={songData}
                    HOST_DOMAIN={HOST_DOMAIN}
                />
            ) : properties.activeTab === 'music' ? (
                <Music
                    properties={properties}
                    handleSong={handleSong}
                    songData={songData}
                    HOST_DOMAIN={HOST_DOMAIN}
                    rawSongData={rawSongData}
                />
            ) : (
                <Settings />
            )}
        </div>
    );
};

export default BaseLayout;
