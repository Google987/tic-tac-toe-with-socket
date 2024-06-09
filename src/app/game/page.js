"use client";
import { useState, useEffect } from 'react';
import styles from './Game.module.css'; // Create Game.module.css for styles
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const Game = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [gameNumber, setGameNumber] = useState('');
    const [currentGame, setCurrentGame] = useState(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        socket.on('move', ({ gameNumber, index, symbol }) => {
            console.log(gameNumber, index, symbol)
            setBoard(prevBoard => {
                const newBoard = [...prevBoard];
                newBoard[index] = symbol;
                setIsXNext(symbol !== 'X');
                return newBoard;
            });
        });

        socket.on('gameCreated', ({ gameNumber }) => {
            setCurrentGame(gameNumber);
            setStatus(`Game created. Your game number is ${gameNumber}`);
        });

        socket.on('gameJoined', ({ gameNumber }) => {
            setCurrentGame(gameNumber);
            setStatus(`Joined game ${gameNumber}`);
        });

        socket.on('userJoined', ({ userId }) => {
            setStatus(`User ${userId} joined the game`);
        });

        socket.on('error', (error) => {
            setStatus(`Error: ${error}`);
        });

        return () => {
            socket.off('move');
            socket.off('gameCreated');
            socket.off('gameJoined');
            socket.off('userJoined');
            socket.off('error');
        };
    }, []);

    const handleClick = (index) => {
        if (!currentGame) {
            setStatus('Create or join a game first!');
            return;
        }
        if (board[index] || calculateWinner(board)) return;
        const symbol = isXNext ? 'X' : 'O';
        socket.emit('move', { gameNumber: currentGame, index, symbol });
    };

    const reset = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
    };

    const handleCreateGame = () => {
        socket.emit('createGame');
    };

    const handleJoinGame = () => {
        if (!gameNumber) return;
        socket.emit('joinGame', gameNumber);
    };

    const winner = calculateWinner(board);
    const isBoardFull = board.every(cell => cell !== null);
    const gameStatus = winner ? `Winner: ${winner}` : isBoardFull ? 'Tie Match' : `Next player: ${isXNext ? 'X' : 'O'}`;

    return (
        <div className={styles.game}>
            <div className={styles.controls}>
                {!currentGame && (
                    <div>
                        <button onClick={handleCreateGame} className={styles.button}>Create Game</button>
                        <div>
                            <input
                                type="text"
                                value={gameNumber}
                                onChange={(e) => setGameNumber(e.target.value)}
                                placeholder="Enter game number"
                                className={styles.input}
                            />
                            <button onClick={handleJoinGame} className={styles.button}>Join Game</button>
                        </div>
                    </div>
                )}
                {status && <div className={styles.status}>{status}</div>}
                {(currentGame && gameStatus) && <div className={styles.status}>{gameStatus}</div>}
            </div>
            <div className={styles.board}>
                {board.map((cell, index) => (
                    <button key={index} className={styles.cell} onClick={() => handleClick(index)} disabled={false}>
                        {cell}
                    </button>
                ))}
            </div>
            {(gameStatus.includes("Winner") || gameStatus.includes('Tie')) && (
                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={reset}
                >
                    Reset
                </button>
            )}
        </div>
    );
};

const calculateWinner = (board) => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
};

export default Game;
