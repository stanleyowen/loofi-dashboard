export interface ScrapedMusic {
    title: string;
    author: string;
    audio: string;
    image: string;
}

export class MusicScraper {
    private static async fetchWithCORS(url: string): Promise<Response> {
        // Using a CORS proxy for client-side scraping
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
            url
        )}`;
        return fetch(proxyUrl);
    }

    static async scrapeFromURL(url: string): Promise<ScrapedMusic[]> {
        try {
            const response = await this.fetchWithCORS(url);
            const data = await response.json();
            const htmlContent = data.contents;

            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Example scraping logic - you'll need to customize this based on your target site
            const musicItems: ScrapedMusic[] = [];

            // Customize these selectors based on the site you're scraping
            const trackElements = doc.querySelectorAll('.track-item'); // Example selector

            trackElements.forEach((element) => {
                const title =
                    element.querySelector('.title')?.textContent?.trim() || '';
                const author =
                    element.querySelector('.artist')?.textContent?.trim() || '';
                const audioSrc =
                    element.querySelector('audio')?.getAttribute('src') || '';
                const imageSrc =
                    element.querySelector('img')?.getAttribute('src') || '';

                if (title && author && audioSrc) {
                    musicItems.push({
                        title,
                        author,
                        audio: audioSrc,
                        image: imageSrc,
                    });
                }
            });

            return musicItems;
        } catch (error) {
            console.error('Error scraping music:', error);
            throw new Error('Failed to scrape music data');
        }
    }

    // Alternative method for scraping from APIs
    static async scrapeFromAPI(apiUrl: string): Promise<ScrapedMusic[]> {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Transform API response to ScrapedMusic format
            return (
                data.tracks?.map((track: any) => ({
                    title: track.name || track.title,
                    author: track.artist?.name || track.author,
                    audio: track.preview_url || track.audio_url,
                    image: track.album?.images?.[0]?.url || track.image_url,
                })) || []
            );
        } catch (error) {
            console.error('Error fetching from API:', error);
            throw new Error('Failed to fetch music from API');
        }
    }

    // Jamendo API scraping method
    static async scrapeFromJamendo(
        options: {
            tags?: string;
            search?: string;
            limit?: number;
            order?:
                | 'popularity_total'
                | 'popularity_month'
                | 'popularity_week'
                | 'name'
                | 'releasedate';
        } = {}
    ): Promise<ScrapedMusic[]> {
        const clientId = process.env.REACT_APP_JAMENDO_CLIENT_ID;

        if (!clientId) {
            throw new Error(
                'Jamendo Client ID not found in environment variables'
            );
        }

        const {
            tags = 'lofi,chill,ambient',
            search = '',
            limit = 20,
            order = 'popularity_total',
        } = options;

        try {
            let apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&order=${order}&include=musicinfo`;

            if (tags) {
                apiUrl += `&tags=${encodeURIComponent(tags)}`;
            }

            if (search) {
                apiUrl += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `Jamendo API responded with status: ${response.status}`
                );
            }

            const data = await response.json();

            return (
                data.results?.map((track: any) => ({
                    title: track.name || 'Unknown Title',
                    author: track.artist_name || 'Unknown Artist',
                    audio: track.audio || track.audiodownload || '',
                    image: track.image || track.album_image || '',
                })) || []
            );
        } catch (error) {
            console.error('Error fetching from Jamendo API:', error);
            throw new Error('Failed to fetch music from Jamendo API');
        }
    }

    // Get popular lofi tracks from Jamendo
    static async getLofiTracks(limit = 20): Promise<ScrapedMusic[]> {
        return this.scrapeFromJamendo({
            tags: 'lofi,chill,ambient,instrumental',
            limit,
            order: 'popularity_total',
        });
    }

    // Search for specific tracks on Jamendo
    static async searchJamendoTracks(
        query: string,
        limit = 20
    ): Promise<ScrapedMusic[]> {
        return this.scrapeFromJamendo({
            search: query,
            limit,
            order: 'popularity_total',
        });
    }
}
