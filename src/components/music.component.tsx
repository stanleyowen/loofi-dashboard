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
} from '@mui/material';
import React, { useState, useEffect } from 'react';

const Music = ({ song, songData, rawSongData }: any) => {
    const [status, setStatus] = useState<{
        isLoading: boolean;
        isError: boolean;
    }>({
        isLoading: false,
        isError: false,
    });
    const [page, setPage] = useState<number>(0);
    const [rowPerPage, setRowPerPage] = useState<number>(10);
    const [musicDialogIsOpen, setMusicDialogIsOpen] = useState<boolean>(false);
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

    const handleStatus = (id: string, value: boolean) => {
        setStatus({ ...status, [id]: value });
    };
    const handleMusicData = (id: string, value: string) => {
        setMusicData({ ...musicData, [id]: value });
    };

    const AddMusic = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
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
                    'loofi-music/' + rawSongData.length ?? 'null'
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
        </div>
    );
};

export default Music;
