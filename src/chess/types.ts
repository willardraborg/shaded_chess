export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export const PIECE_TYPES: readonly PieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

export interface Piece {
    type: PieceType;
    color: PieceColor;
}

// Row 0 is white's back rank (rank 1), col 0 is the a-file.
export interface Square {
    row: number;
    col: number;
}

export type Board = (Piece | null)[][];

export interface CastlingRights {
    kingSide: boolean;
    queenSide: boolean;
}

// Everything needed to know which moves are legal. Treated as immutable:
// applyMove returns a new Position.
export interface Position {
    board: Board;
    turn: PieceColor;
    castling: Record<PieceColor, CastlingRights>;
    // The square a pawn skipped over on the previous move, if it advanced two.
    enPassant: Square | null;
}

export interface Move {
    from: Square;
    to: Square;
    promotion?: PieceType;
    castle?: 'kingSide' | 'queenSide';
    enPassant?: boolean;
}

export function sameSquare(a: Square, b: Square){
    return a.row === b.row && a.col === b.col;
}

export function opponent(color: PieceColor): PieceColor {
    return color === 'white' ? 'black' : 'white';
}
