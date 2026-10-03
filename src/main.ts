import './style.css';
import { Game } from './chess/game';
import { sameSquare } from './chess/types';
import type { Square } from './chess/types';
import { createStage } from './view/stage';
import { loadPieceModels } from './view/assets';
import { BoardView } from './view/boardView';
import { createPicker } from './view/picking';

const app = document.getElementById('app')!;
const stage = createStage(app);

const models = await loadPieceModels().catch((error) => {
    app.insertAdjacentHTML('beforeend', '<p class="error">Could not load the chess pieces.</p>');
    throw error;
});

const game = new Game();
const view = new BoardView(stage.scene, models, game.board);
const squareUnderPointer = createPicker(stage.camera, stage.renderer.domElement, view.pickables);

let selected: Square | null = null;

function select(square: Square | null){
    selected = square;
    // A promoting pawn has one move per promotion piece; mark each square once.
    const targets = square ? game.movesFrom(square).map((move) => move.to) : [];
    view.select(square, targets.filter((to, i) => targets.findIndex((other) => sameSquare(other, to)) === i));
}

stage.renderer.domElement.addEventListener('click', (event) => {
    const square = squareUnderPointer(event);
    if(!square) return;

    if(game.canSelect(square)){
        // Clicking the selected piece again puts it back down.
        select(selected && sameSquare(selected, square) ? null : square);
    } else if(selected){
        game.tryMove(selected, square);
        selected = null;
        view.sync(game.board);
    }
});
