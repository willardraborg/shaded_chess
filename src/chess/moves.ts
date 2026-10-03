import { isOnBoard, pieceAt } from './board';
import { applyMove } from './position';
import { opponent, sameSquare } from './types';
import type { Board, Move, Piece, PieceColor, PieceType, Position, Square } from './types';

type Offset = readonly [number, number]; // [rows, cols]

const ROOK_DIRECTIONS: Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRECTIONS: Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const QUEEN_DIRECTIONS: Offset[] = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS];
const KING_OFFSETS = QUEEN_DIRECTIONS;
const KNIGHT_OFFSETS: Offset[] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const PROMOTION_TYPES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

// Moves a piece could make if its own king's safety didn't matter.
type MoveGenerator = (position: Position, from: Square, piece: Piece) => Move[];

const generators: Record<PieceType, MoveGenerator> = {
    rook: (position, from, piece) => slide(position.board, from, piece, ROOK_DIRECTIONS),
    bishop: (position, from, piece) => slide(position.board, from, piece, BISHOP_DIRECTIONS),
    queen: (position, from, piece) => slide(position.board, from, piece, QUEEN_DIRECTIONS),
    knight: (position, from, piece) => jump(position.board, from, piece, KNIGHT_OFFSETS),
    king: (position, from, piece) => [
        ...jump(position.board, from, piece, KING_OFFSETS),
        ...castlingMoves(position, from, piece),
    ],
    pawn: pawnMoves,
};

export function legalMovesFrom(position: Position, from: Square): Move[] {
    const piece = pieceAt(position.board, from);
    if(!piece || piece.color !== position.turn) return [];
    return generators[piece.type](position, from, piece)
        .filter((move) => !isInCheck(applyMove(position, move), piece.color));
}

export function allLegalMoves(position: Position): Move[] {
    const moves: Move[] = [];
    for(let row = 0; row <= 7; row++){
        for(let col = 0; col <= 7; col++){
            moves.push(...legalMovesFrom(position, {row, col}));
        }
    }
    return moves;
}

export function hasLegalMove(position: Position){
    for(let row = 0; row <= 7; row++){
        for(let col = 0; col <= 7; col++){
            if(legalMovesFrom(position, {row, col}).length > 0) return true;
        }
    }
    return false;
}

export function isInCheck(position: Position, color: PieceColor){
    const king = findKing(position.board, color);
    return king !== null && isAttacked(position.board, king, opponent(color));
}

// Whether any piece of color `by` attacks `square`. Works backwards from the square:
// e.g. if a knight's jump from here lands on an enemy knight, that knight attacks here.
export function isAttacked(board: Board, square: Square, by: PieceColor){
    const holds = (row: number, col: number, types: PieceType[]) => {
        if(!isOnBoard(row, col)) return false;
        const piece = board[row][col];
        return piece !== null && piece.color === by && types.includes(piece.type);
    };

    for(const [dr, dc] of KNIGHT_OFFSETS){
        if(holds(square.row + dr, square.col + dc, ['knight'])) return true;
    }
    for(const [dr, dc] of KING_OFFSETS){
        if(holds(square.row + dr, square.col + dc, ['king'])) return true;
    }
    // An attacking pawn stands one row behind the square, from its own side's point of view.
    const pawnRow = square.row - pawnDirection(by);
    if(holds(pawnRow, square.col - 1, ['pawn']) || holds(pawnRow, square.col + 1, ['pawn'])) return true;

    const slidesTo = (directions: Offset[], types: PieceType[]) => directions.some(([dr, dc]) => {
        let row = square.row + dr, col = square.col + dc;
        while(isOnBoard(row, col) && !board[row][col]){
            row += dr;
            col += dc;
        }
        return holds(row, col, types);
    });
    return slidesTo(ROOK_DIRECTIONS, ['rook', 'queen']) || slidesTo(BISHOP_DIRECTIONS, ['bishop', 'queen']);
}

// Rook, bishop, queen: keep going until the edge or a piece; enemy pieces can be captured.
function slide(board: Board, from: Square, piece: Piece, directions: Offset[]){
    const moves: Move[] = [];
    for(const [dr, dc] of directions){
        for(let row = from.row + dr, col = from.col + dc; isOnBoard(row, col); row += dr, col += dc){
            const target = board[row][col];
            if(target?.color === piece.color) break;
            moves.push({from, to: {row, col}});
            if(target) break;
        }
    }
    return moves;
}

// Knight, king: a fixed set of squares, any not held by a friendly piece.
function jump(board: Board, from: Square, piece: Piece, offsets: Offset[]){
    const moves: Move[] = [];
    for(const [dr, dc] of offsets){
        const row = from.row + dr, col = from.col + dc;
        if(isOnBoard(row, col) && board[row][col]?.color !== piece.color) moves.push({from, to: {row, col}});
    }
    return moves;
}

function pawnDirection(color: PieceColor){
    return color === 'white' ? 1 : -1;
}

function pawnMoves(position: Position, from: Square, piece: Piece){
    const {board} = position;
    const direction = pawnDirection(piece.color);
    const startRow = piece.color === 'white' ? 1 : 6;
    const lastRow = piece.color === 'white' ? 7 : 0;
    const moves: Move[] = [];

    const add = (to: Square) => {
        if(to.row === lastRow) for(const promotion of PROMOTION_TYPES) moves.push({from, to, promotion});
        else moves.push({from, to});
    };

    // A pawn is never on its last row, so one step forward is always on the board.
    const oneStep = {row: from.row + direction, col: from.col};
    if(!pieceAt(board, oneStep)){
        add(oneStep);
        const twoSteps = {row: from.row + 2 * direction, col: from.col};
        if(from.row === startRow && !pieceAt(board, twoSteps)) add(twoSteps);
    }

    for(const dc of [-1, 1]){
        const to = {row: from.row + direction, col: from.col + dc};
        if(!isOnBoard(to.row, to.col)) continue;
        const target = pieceAt(board, to);
        if(target && target.color !== piece.color) add(to);
        else if(position.enPassant && sameSquare(position.enPassant, to)) moves.push({from, to, enPassant: true});
    }
    return moves;
}

// The king may not castle out of or through check; landing in check is caught by the
// legality filter like any other move.
function castlingMoves(position: Position, from: Square, piece: Piece){
    const {board} = position;
    const rights = position.castling[piece.color];
    const row = piece.color === 'white' ? 0 : 7;
    const enemy = opponent(piece.color);
    const moves: Move[] = [];
    if(!rights.kingSide && !rights.queenSide) return moves;
    if(isAttacked(board, from, enemy)) return moves;

    const empty = (...cols: number[]) => cols.every((col) => !board[row][col]);
    const safe = (col: number) => !isAttacked(board, {row, col}, enemy);

    if(rights.kingSide && empty(5, 6) && safe(5)){
        moves.push({from, to: {row, col: 6}, castle: 'kingSide'});
    }
    if(rights.queenSide && empty(1, 2, 3) && safe(3)){
        moves.push({from, to: {row, col: 2}, castle: 'queenSide'});
    }
    return moves;
}

function findKing(board: Board, color: PieceColor): Square | null {
    for(let row = 0; row <= 7; row++){
        for(let col = 0; col <= 7; col++){
            const piece = board[row][col];
            if(piece?.type === 'king' && piece.color === color) return {row, col};
        }
    }
    return null;
}
