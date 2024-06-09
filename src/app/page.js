"use client";
import Link from 'next/link';

export default function Home() {
    return (
        <div>
            <h1>Welcome to Tic-Tac-Toe</h1>
            <Link href="/game">
                Start Game
            </Link>
        </div>
    );
}
