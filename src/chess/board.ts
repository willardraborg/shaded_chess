import type { Board, PieceType, Square } from './types';

const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

export function createInitialBoard(): Board {
    const board: Board = [];
    for(let row = 0; row <= 7; row++){
        board.push(new Array(8).fill(null));
    }
    for(let col = 0; col <= 7; col++){
        board[0][col] = {type: backRank[col], color: 'white'};
        board[1][col] = {type: 'pawn', color: 'white'};
        board[6][col] = {type: 'pawn', color: 'black'};
        board[7][col] = {type: backRank[col], color: 'black'};
    }
    return board;
}

export function isOnBoard(row: number, col: number){
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

export function pieceAt(board: Board, square: Square){
    return board[square.row][square.col];
}
