// page.js
"use client";
import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';
import io from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

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
        <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
            <div className="mb-6 text-center">
                {!currentGame && (
                    <div>
                        <button onClick={handleCreateGame} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Create Game</button>
                        <div className="mt-4 flex items-center space-x-2">
                            <input
                                type="text"
                                value={gameNumber}
                                onChange={(e) => setGameNumber(e.target.value)}
                                placeholder="Enter game number"
                                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                            />
                            <button onClick={handleJoinGame} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Join Game</button>
                        </div>
                    </div>
                )}
                {currentGame && (
                    <div className="mt-2 text-lg font-bold text-gray-700 items-center justify-center flex">
                        {`Game No: ${currentGame}`}
                        <CopyToClipboard text={currentGame} onCopy={() => setStatus('Game number copied!')}>
                            <Image src="/images/copy.png" alt="Copy Game Number" width={15} height={20} className="ml-2 cursor-pointer" /> 
                        </CopyToClipboard>
                    </div>
                )}
                {(currentGame && gameStatus) && <div className="mt-2 text-lg text-gray-700">{gameStatus}</div>}
                {(currentGame && mySymbol) && <div className="mt-2 text-lg text-gray-700">{`You are ${mySymbol}`}</div>}
                {status && <div className="mt-2 text-red-500">{status}</div>}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {board.map((cell, index) => (
                    <button key={index} className="w-20 h-20 bg-white border border-gray-300 text-xl flex items-center justify-center hover:bg-gray-100" onClick={() => handleClick(index)}>
                        {cell}
                    </button>
                ))}
            </div>
            {(gameStatus.includes("Winner") || gameStatus.includes('Tie')) && (
                <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
