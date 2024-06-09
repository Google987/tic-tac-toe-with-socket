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
    const [mySymbol, setMySymbol] = useState('');
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        let statusTimer;
        if (status) {
            statusTimer = setTimeout(() => {
                setStatus('');
            }, 5000); // 5000 milliseconds = 5 seconds
        }
        return () => {
            clearTimeout(statusTimer); // Clear the timer on cleanup
        };
    }, [status]);

    useEffect(() => {
        socket.on('move', ({ gameNumber, index, symbol }) => {
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
            setHasStarted(true);
            setStatus(`User ${userId} joined the game`);
        });

        socket.on('resetGame', () => {
            reset(false);
        });

        socket.on('error', (error) => {
            setStatus(`Error: ${error}`);
        });

        return () => {
            socket.off('move');
            socket.off('gameCreated');
            socket.off('gameJoined');
            socket.off('userJoined');
            socket.off('resetGame');
            socket.off('error');
        };
    }, []);

    const handleClick = (index) => {
        if (!currentGame) {
            setStatus('Create or join a game first!');
            return;
        }
        if (!hasStarted) {
            setStatus('Please wait for opponent to join');
            return;
        }
        if (board[index] || calculateWinner(board)) return;
        if (isXNext && mySymbol != 'X') {
            setStatus('Please wait for opponent\'s move');
            return;
        }
        if (isXNext == false && mySymbol == 'X') {
            setStatus('Please wait for opponent\'s move');
            return;
        }
        const symbol = isXNext ? 'X' : 'O';
        socket.emit('move', { gameNumber: currentGame, index, symbol });
    };

    const reset = (isUserInitiated = true) => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        if (isUserInitiated) {
            socket.emit('resetGame', currentGame);
        }
    };

    const handleCreateGame = () => {
        setMySymbol('X');
        socket.emit('createGame');
    };

    const handleJoinGame = () => {
        if (!gameNumber) return;
        setMySymbol('O');
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
                {currentGame && <div className={styles.status}>{`Game No: ${currentGame}`}</div>}
                {(currentGame && gameStatus) && <div className={styles.status}>{gameStatus}</div>}
                {(currentGame && mySymbol) && <div className={styles.status}>{`You are ${mySymbol}`}</div>}
            </div>
            <div className={styles.board}>
                {board.map((cell, index) => (
                    <button key={index} className={styles.cell} onClick={() => handleClick(index)}>
                        {cell}
                    </button>
                ))}
            </div>
            {(gameStatus.includes("Winner") || gameStatus.includes('Tie')) && (
                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={()=>reset(true)}
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
