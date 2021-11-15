import { getDatabase, ref, set } from '@firebase/database';
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
        title: '',
        author: '',
        audio: '',
        image: '',
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
        set(
            ref(getDatabase(), 'loofi-music/' + songData.length ?? 'null'),
            musicData
        )
            .then(() => {
                handleStatus('isLoading', false);
                setMusicDialogIsOpen(false);
                setMusicData({
                    title: '',
                    author: '',
                    audio: '',
                    image: '',
                });
            })
            .catch(() => {
                handleStatus('isLoading', false);
                handleStatus('isError', true);
            });
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
                    <p className="center-align">Musics</p>
                </div>
                <div className="card p-10">
                    <h2 className="center-align">-</h2>
                    <p className="center-align">Musics</p>
                </div>
            </div>

            <Button
                variant="outlined"
                onClick={() => setMusicDialogIsOpen(true)}
            >
                Add Music
            </Button>
            <TableContainer>
                <Table stickyHeader className="card">
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
                                        <TableRow hover key={index}>
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
                            <TableCell colSpan={2}>
                                <LinearProgress />
                            </TableCell>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                className="card"
                component="div"
                count={rawSongData.length}
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
                onClose={() => setMusicDialogIsOpen(false)}
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
                                        handleMusicData(data, e.target.value)
                                    }
                                />
                            );
                        }
                    )}
                </DialogContent>
                <DialogActions>
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
