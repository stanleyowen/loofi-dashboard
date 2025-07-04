import { getDatabase, ref, set, remove, update } from '@firebase/database';
import {
    Alert,
    Button,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Tabs,
    Tab,
    Box,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { MusicScraper, ScrapedMusic } from '../lib/scrapper.component';

const Music = ({ song, songData, rawSongData }: any) => {
    const [status, setStatus] = useState<{
        isLoading: boolean;
        isError: boolean;
        isScraping: boolean;
    }>({
        isLoading: false,
        isError: false,
        isScraping: false,
    });
    const [page, setPage] = useState<number>(0);
    const [rowPerPage, setRowPerPage] = useState<number>(10);
    const [musicDialogIsOpen, setMusicDialogIsOpen] = useState<boolean>(false);
    const [tabValue, setTabValue] = useState<number>(0);
    const [scrapeUrl, setScrapeUrl] = useState<string>('');
    const [scrapedMusic, setScrapedMusic] = useState<ScrapedMusic[]>([]);
    const [selectedMusic, setSelectedMusic] = useState<Set<number>>(new Set());
    const [musicData, setMusicData] = useState<any>({
        audio: '',
        author: '',
        image: '',
        title: '',
        properties: {
            isUpdate: false,
            id: null,
        },
    });
    const [jamendoOptions, setJamendoOptions] = useState({
        method: 'popular',
        tags: 'lofi,chill,ambient',
        search: '',
        limit: 20,
    });

    // Helper function to check for duplicates
    const isDuplicate = (newMusic: { title: string; author: string }) => {
        // Check if rawSongData exists and is an array
        if (!rawSongData || !Array.isArray(rawSongData)) {
            return false;
        }

        return rawSongData.some(
            (existingMusic: any) =>
                existingMusic?.title?.toLowerCase().trim() ===
                    newMusic?.title?.toLowerCase().trim() &&
                existingMusic?.author?.toLowerCase().trim() ===
                    newMusic?.author?.toLowerCase().trim()
        );
    };

    // Helper function to filter out duplicates from scraped music
    const filterDuplicates = (scrapedTracks: ScrapedMusic[]) => {
        return scrapedTracks.filter((track) => !isDuplicate(track));
    };

    const handleScrapeMusic = async () => {
        if (tabValue === 1 && !scrapeUrl.trim()) return;

        setStatus({ ...status, isScraping: true });
        try {
            let scrapedData: ScrapedMusic[] = [];

            if (tabValue === 1) {
                // Web scraping
                scrapedData = await MusicScraper.scrapeFromURL(scrapeUrl);
            } else if (tabValue === 2) {
                // Jamendo API
                if (jamendoOptions.method === 'popular') {
                    scrapedData = await MusicScraper.getLofiTracks(
                        jamendoOptions.limit
                    );
                } else if (
                    jamendoOptions.method === 'search' &&
                    jamendoOptions.search.trim()
                ) {
                    scrapedData = await MusicScraper.searchJamendoTracks(
                        jamendoOptions.search,
                        jamendoOptions.limit
                    );
                } else if (jamendoOptions.method === 'tags') {
                    scrapedData = await MusicScraper.scrapeFromJamendo({
                        tags: jamendoOptions.tags,
                        limit: jamendoOptions.limit,
                    });
                }
            }

            // Filter out duplicates from scraped data
            const uniqueScrapedData = filterDuplicates(scrapedData);
            setScrapedMusic(uniqueScrapedData);
            setStatus({ ...status, isScraping: false, isError: false });

            // Show notification if duplicates were found
            if (scrapedData.length > uniqueScrapedData.length) {
                console.log(
                    `Found ${
                        scrapedData.length - uniqueScrapedData.length
                    } duplicate tracks that were filtered out.`
                );
            }
        } catch (error) {
            setStatus({ ...status, isScraping: false, isError: true });
        }
    };

    const handleSelectMusic = (index: number) => {
        const newSelected = new Set(selectedMusic);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedMusic(newSelected);
    };

    const handleAddSelectedMusic = async () => {
        setStatus({ ...status, isLoading: true });
        const selectedItems = Array.from(selectedMusic).map(
            (index) => scrapedMusic[index]
        );

        // Double-check for duplicates before adding (in case data changed)
        const uniqueSelectedItems = selectedItems.filter(
            (music) => !isDuplicate(music)
        );

        if (uniqueSelectedItems.length !== selectedItems.length) {
            console.log(
                `${
                    selectedItems.length - uniqueSelectedItems.length
                } selected tracks were already in the database and will be skipped.`
            );
        }

        try {
            for (const music of uniqueSelectedItems) {
                await set(
                    ref(
                        getDatabase(),
                        `loofi-music/${
                            rawSongData.length +
                            uniqueSelectedItems.indexOf(music)
                        }`
                    ),
                    music
                );
            }

            setStatus({ ...status, isLoading: false });
            setMusicDialogIsOpen(false);
            setScrapedMusic([]);
            setSelectedMusic(new Set());
            setScrapeUrl('');
        } catch (error) {
            setStatus({ ...status, isLoading: false, isError: true });
        }
    };

    const resetDialog = () => {
        setMusicDialogIsOpen(false);
        setTabValue(0);
        setScrapeUrl('');
        setScrapedMusic([]);
        setSelectedMusic(new Set());
        setJamendoOptions({
            method: 'popular',
            tags: 'lofi,chill,ambient',
            search: '',
            limit: 20,
        });
        setMusicData({
            audio: '',
            author: '',
            image: '',
            title: '',
            properties: {
                isUpdate: false,
                id: null,
            },
        });
    };

    const handleStatus = (id: string, value: boolean) => {
        setStatus({ ...status, [id]: value });
    };
    const handleMusicData = (id: string, value: string) => {
        setMusicData({ ...musicData, [id]: value });
    };

    const AddMusic = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // Check for duplicates in manual entry
        if (!musicData.properties.isUpdate && isDuplicate(musicData)) {
            setStatus({ ...status, isError: true });
            return;
        }

        handleStatus('isLoading', true);
        const id = musicData.properties.id + page * rowPerPage;

        if (musicData.properties.isUpdate) {
            delete musicData.properties;
            update(ref(getDatabase()), {
                ['loofi-music/' + id]: musicData,
            })
                .then(() => {
                    handleStatus('isLoading', false);
                    setMusicDialogIsOpen(false);
                    setMusicData({
                        audio: '',
                        author: '',
                        image: '',
                        title: '',
                        properties: {
                            isUpdate: false,
                            id: null,
                        },
                    });
                })
                .catch(() => {
                    handleStatus('isLoading', false);
                    handleStatus('isError', true);
                });
        } else {
            delete musicData.properties;
            set(
                ref(
                    getDatabase(),
                    'loofi-music/' + (rawSongData.length ?? 'null')
                ),
                musicData
            )
                .then(() => {
                    handleStatus('isLoading', false);
                    setMusicDialogIsOpen(false);
                    setMusicData({
                        audio: '',
                        author: '',
                        image: '',
                        title: '',
                        properties: {
                            isUpdate: false,
                            id: null,
                        },
                    });
                })
                .catch(() => {
                    handleStatus('isLoading', false);
                    handleStatus('isError', true);
                });
        }
    };

    const UpdateMusic = (id: number, data: any) => {
        setMusicDialogIsOpen(true);
        setMusicData({
            ...data,
            properties: {
                id,
                isUpdate: true,
            },
        });
    };

    const DeleteMusic = () => {
        setMusicDialogIsOpen(false);
        const id = musicData.properties.id + page * rowPerPage;
        remove(ref(getDatabase(), 'loofi-music/' + id));
    };

    const columns = [
        {
            id: 'title',
            label: 'Title',
            minWidth: 170,
        },
        {
            id: 'author',
            label: 'Author',
            minWidth: 100,
        },
    ];

    return (
        <div className="m-10">
            <div className="col-2 mb-10">
                <div className="card p-10">
                    <h2 className="center-align">
                        {rawSongData.length === 0 ? '-' : rawSongData.length}
                    </h2>
                    <p className="center-align">Music</p>
                </div>
                <div className="card p-10">
                    <h2 className="center-align">-</h2>
                    <p className="center-align">Music</p>
                </div>
            </div>

            <Button
                variant="outlined"
                onClick={() => setMusicDialogIsOpen(true)}
            >
                Add Music
            </Button>

            <TableContainer>
                <Table className="card">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align="left"
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rawSongData.length > 0 ? (
                            rawSongData
                                .slice(
                                    page * rowPerPage,
                                    page * rowPerPage + rowPerPage
                                )
                                .map((song: any, index: number) => {
                                    return (
                                        <TableRow
                                            hover
                                            key={index}
                                            onClick={() =>
                                                UpdateMusic(index, song)
                                            }
                                        >
                                            {columns.map((column) => {
                                                return (
                                                    <TableCell key={column.id}>
                                                        {song[column.id]}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <LinearProgress />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                className="card"
                component="div"
                count={rawSongData.length ?? 0}
                rowsPerPage={rowPerPage}
                page={page}
                onPageChange={(_, newPage) => {
                    setPage(newPage);
                }}
                onRowsPerPageChange={(e) => {
                    setPage(0);
                    setRowPerPage(+e.target.value);
                }}
            />

            <Dialog
                fullWidth
                open={musicDialogIsOpen}
                onClose={() => {
                    setMusicDialogIsOpen(false);
                    setMusicData({
                        audio: '',
                        author: '',
                        image: '',
                        title: '',
                        properties: {
                            isUpdate: false,
                            id: null,
                        },
                    });
                }}
            >
                <DialogTitle>Add Music</DialogTitle>
                <DialogContent>
                    {status.isError ? (
                        <Alert severity="error" className="w-100 border-box">
                            Something went wrong. Please try again.
                        </Alert>
                    ) : null}

                    {Object.keys(musicData).map(
                        (data: string, index: number) => {
                            if (data === 'properties') return null;
                            else
                                return (
                                    <TextField
                                        fullWidth
                                        type="text"
                                        key={index}
                                        label={
                                            Array.from(data)[0].toUpperCase() +
                                            data.slice(1)
                                        }
                                        margin="dense"
                                        variant="standard"
                                        autoFocus={index === 0}
                                        value={musicData[data]}
                                        onChange={(e) =>
                                            handleMusicData(
                                                data,
                                                e.target.value
                                            )
                                        }
                                    />
                                );
                        }
                    )}
                </DialogContent>
                <DialogActions>
                    {musicData.properties?.isUpdate ? (
                        <Button
                            color="error"
                            onClick={DeleteMusic}
                            disabled={status.isLoading}
                        >
                            Delete
                        </Button>
                    ) : null}
                    <Button onClick={() => setMusicDialogIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={AddMusic} disabled={status.isLoading}>
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                fullWidth
                maxWidth="md"
                open={musicDialogIsOpen}
                onClose={resetDialog}
            >
                <DialogTitle>
                    {musicData.properties?.isUpdate
                        ? 'Update Music'
                        : 'Add Music'}
                </DialogTitle>
                <DialogContent>
                    {status.isError ? (
                        <Alert severity="error" className="w-100 border-box">
                            {!musicData.properties.isUpdate &&
                            isDuplicate(musicData)
                                ? 'This music already exists in your library. Please check the title and author.'
                                : 'Something went wrong. Please try again.'}
                        </Alert>
                    ) : null}

                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_, newValue) => setTabValue(newValue)}
                        >
                            <Tab label="Manual Entry" />
                            <Tab label="Web Scraping" />
                            <Tab label="Jamendo API" />
                        </Tabs>
                    </Box>

                    {tabValue === 0 && (
                        <Box sx={{ pt: 2 }}>
                            {Object.keys(musicData).map(
                                (data: string, index: number) => {
                                    if (data === 'properties') return null;
                                    return (
                                        <TextField
                                            fullWidth
                                            type="text"
                                            key={index}
                                            label={
                                                Array.from(
                                                    data
                                                )[0].toUpperCase() +
                                                data.slice(1)
                                            }
                                            margin="dense"
                                            variant="standard"
                                            autoFocus={index === 0}
                                            value={musicData[data]}
                                            onChange={(e) =>
                                                handleMusicData(
                                                    data,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    );
                                }
                            )}
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ pt: 2 }}>
                            <TextField
                                fullWidth
                                label="Website URL to scrape"
                                value={scrapeUrl}
                                onChange={(e) => setScrapeUrl(e.target.value)}
                                placeholder="https://example-music-site.com"
                                margin="dense"
                            />
                            <Button
                                variant="outlined"
                                onClick={handleScrapeMusic}
                                disabled={
                                    status.isScraping || !scrapeUrl.trim()
                                }
                                sx={{ mt: 2, mb: 2 }}
                            >
                                {status.isScraping
                                    ? 'Scraping...'
                                    : 'Scrape Music'}
                            </Button>

                            {scrapedMusic.length > 0 && (
                                <Box>
                                    <p>
                                        Found {scrapedMusic.length} tracks.
                                        Select the ones you want to add:
                                    </p>
                                    {/* ...existing music selection UI... */}
                                </Box>
                            )}
                        </Box>
                    )}

                    {tabValue === 2 && (
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Method</InputLabel>
                                <Select
                                    value={jamendoOptions.method}
                                    onChange={(e) =>
                                        setJamendoOptions({
                                            ...jamendoOptions,
                                            method: e.target.value,
                                        })
                                    }
                                >
                                    <MenuItem value="popular">
                                        Popular LoFi Tracks
                                    </MenuItem>
                                    <MenuItem value="search">
                                        Search Tracks
                                    </MenuItem>
                                    <MenuItem value="tags">
                                        Browse by Tags
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {jamendoOptions.method === 'search' && (
                                <TextField
                                    fullWidth
                                    label="Search Query"
                                    value={jamendoOptions.search}
                                    onChange={(e) =>
                                        setJamendoOptions({
                                            ...jamendoOptions,
                                            search: e.target.value,
                                        })
                                    }
                                    placeholder="Enter artist name, song title, etc."
                                    margin="dense"
                                />
                            )}

                            {jamendoOptions.method === 'tags' && (
                                <TextField
                                    fullWidth
                                    label="Tags (comma separated)"
                                    value={jamendoOptions.tags}
                                    onChange={(e) =>
                                        setJamendoOptions({
                                            ...jamendoOptions,
                                            tags: e.target.value,
                                        })
                                    }
                                    placeholder="lofi,chill,ambient,instrumental"
                                    margin="dense"
                                />
                            )}

                            <TextField
                                fullWidth
                                type="number"
                                label="Number of tracks to fetch"
                                value={jamendoOptions.limit}
                                onChange={(e) =>
                                    setJamendoOptions({
                                        ...jamendoOptions,
                                        limit: parseInt(e.target.value) || 20,
                                    })
                                }
                                margin="dense"
                                inputProps={{ min: 1, max: 50 }}
                            />

                            <Button
                                variant="outlined"
                                onClick={handleScrapeMusic}
                                disabled={
                                    status.isScraping ||
                                    (jamendoOptions.method === 'search' &&
                                        !jamendoOptions.search.trim())
                                }
                                sx={{ mt: 2, mb: 2 }}
                            >
                                {status.isScraping
                                    ? 'Fetching...'
                                    : 'Fetch from Jamendo'}
                            </Button>

                            {scrapedMusic.length > 0 && (
                                <Box>
                                    <p>
                                        Found {scrapedMusic.length} unique
                                        tracks from Jamendo. Select the ones you
                                        want to add:
                                    </p>
                                    <Box
                                        sx={{
                                            maxHeight: 300,
                                            overflow: 'auto',
                                        }}
                                    >
                                        {scrapedMusic.map((music, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    p: 2,
                                                    mb: 1,
                                                    border: 1,
                                                    borderColor:
                                                        selectedMusic.has(index)
                                                            ? 'primary.main'
                                                            : 'grey.300',
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    backgroundColor:
                                                        selectedMusic.has(index)
                                                            ? 'primary.light'
                                                            : 'transparent',
                                                }}
                                                onClick={() =>
                                                    handleSelectMusic(index)
                                                }
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                    }}
                                                >
                                                    {music.image && (
                                                        <img
                                                            src={music.image}
                                                            alt={music.title}
                                                            style={{
                                                                width: 50,
                                                                height: 50,
                                                                borderRadius: 4,
                                                            }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div>
                                                            <strong>
                                                                {music.title}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                color: 'gray',
                                                            }}
                                                        >
                                                            {music.author}
                                                        </div>
                                                    </div>
                                                    {selectedMusic.has(
                                                        index
                                                    ) && (
                                                        <Chip
                                                            label="Selected"
                                                            color="primary"
                                                            size="small"
                                                        />
                                                    )}
                                                </div>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {musicData.properties?.isUpdate ? (
                        <Button
                            color="error"
                            onClick={DeleteMusic}
                            disabled={status.isLoading}
                        >
                            Delete
                        </Button>
                    ) : null}
                    <Button onClick={resetDialog}>Cancel</Button>
                    {tabValue === 0 ? (
                        <Button
                            onClick={AddMusic}
                            disabled={
                                status.isLoading ||
                                (!musicData.properties.isUpdate &&
                                    isDuplicate(musicData) &&
                                    musicData.title &&
                                    musicData.author)
                            }
                        >
                            {musicData.properties?.isUpdate ? 'Update' : 'Add'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAddSelectedMusic}
                            disabled={
                                status.isLoading || selectedMusic.size === 0
                            }
                        >
                            Add Selected ({selectedMusic.size})
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Music;
