import { createInitialBoard } from './board';
import { opponent } from './types';
import type { CastlingRights, Move, PieceColor, Position, Square } from './types';

export function createInitialPosition(): Position {
    return {
        board: createInitialBoard(),
        turn: 'white',
        castling: {
            white: {kingSide: true, queenSide: true},
            black: {kingSide: true, queenSide: true},
        },
        enPassant: null,
    };
}

// Returns the position after `move`, which is assumed to come from the move generator.
// Pieces that stay on the board keep their object identity, so the view can follow them.
export function applyMove(position: Position, move: Move): Position {
    const {from, to} = move;
    const board = position.board.map((row) => [...row]);
    const piece = board[from.row][from.col]!;

    board[from.row][from.col] = null;
    board[to.row][to.col] = move.promotion ? {type: move.promotion, color: piece.color} : piece;

    // The captured pawn sits beside the moving pawn, not on the square it moves to.
    if(move.enPassant) board[from.row][to.col] = null;

    if(move.castle){
        const [rookFrom, rookTo] = move.castle === 'kingSide' ? [7, 5] : [0, 3];
        board[from.row][rookTo] = board[from.row][rookFrom];
        board[from.row][rookFrom] = null;
    }

    const castling: Record<PieceColor, CastlingRights> = {
        white: {...position.castling.white},
        black: {...position.castling.black},
    };
    if(piece.type === 'king') castling[piece.color] = {kingSide: false, queenSide: false};
    // A rook moving off its corner, or being captured there, ends castling on that side.
    for(const square of [from, to]) clearCornerRight(castling, square);

    const doubleStep = piece.type === 'pawn' && Math.abs(to.row - from.row) === 2;

    return {
        board,
        turn: opponent(position.turn),
        castling,
        enPassant: doubleStep ? {row: (from.row + to.row) / 2, col: from.col} : null,
    };
}

function clearCornerRight(castling: Record<PieceColor, CastlingRights>, square: Square){
    const color: PieceColor | null = square.row === 0 ? 'white' : square.row === 7 ? 'black' : null;
    if(!color) return;
    if(square.col === 0) castling[color].queenSide = false;
    if(square.col === 7) castling[color].kingSide = false;
}
