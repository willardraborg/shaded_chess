export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
    type: PieceType;
    color: PieceColor;
}

export type Board = (Piece | null)[][];

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

export function squareToWorld(row: number, col: number){
    return {x: col - 3.5, z: 3.5 - row};
}

export function movePiece(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number){
    const captured = board[toRow][toCol];
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = null;
    return captured;
}

