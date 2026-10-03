import { pieceAt } from './board';
import { hasLegalMove, isInCheck, legalMovesFrom } from './moves';
import { applyMove, createInitialPosition } from './position';
import { sameSquare } from './types';
import type { Move, PieceType, Position, Square } from './types';

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

export class Game {
    private position: Position = createInitialPosition();

    get board(){
        return this.position.board;
    }

    get turn(){
        return this.position.turn;
    }

    // Whether the side to move owns the piece on this square.
    canSelect(square: Square){
        return pieceAt(this.board, square)?.color === this.turn;
    }

    movesFrom(square: Square): Move[] {
        return legalMovesFrom(this.position, square);
    }

    // Plays the move if it's legal. A pawn reaching the last row becomes `promotion`.
    tryMove(from: Square, to: Square, promotion: PieceType = 'queen'): Move | null {
        const move = this.movesFrom(from).find((candidate) =>
            sameSquare(candidate.to, to) && (!candidate.promotion || candidate.promotion === promotion));
        if(!move) return null;
        this.position = applyMove(this.position, move);
        return move;
    }

    status(): GameStatus {
        const check = isInCheck(this.position, this.turn);
        if(hasLegalMove(this.position)) return check ? 'check' : 'playing';
        return check ? 'checkmate' : 'stalemate';
    }
}
