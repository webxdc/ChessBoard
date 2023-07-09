// @ts-check
import {normalizeName, state, getSummary} from "../common.js";
import m from "mithril";
import '@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.js';

let $board = undefined;

export const BoardComponent = {
    view: () => {
        $("#root").css("align-items", "");
        const container = m("div#game", [
            m("h3.sub", [
                m("div.tag.white", normalizeName(state.whiteName)),
                " Vs. ",
                m("div.tag.black", normalizeName(state.blackName))
            ]),
            m("div#board"),
            m("h3.sub", getStatus())
        ]);
        const turn = (state.game.turn() === "w")? state.whiteAddr : state.blackAddr;
        if (!state.inReplayMode) {
            if (state.surrenderAddr || state.game.isGameOver()) {
                container.children.push(
                    m("a", {
                        class: "btn",
                        onclick: () => replay()
                    }, "Replay"),
                    m("br"),
                    m("a", {
                        class: "btn",
                        onclick: () => share()
                    }, "Share")
                );
            } else if (state.selfAddr === turn) {
                container.children.push(
                    m("a", {
                        class: "btn",
                        onclick: () => surrender()
                    }, "Surrender")
                );
            }
        }
        return container;
    },
    oncreate: function() {this.initBoard();},
    setHighlight: function() {
        clearHighlight();
        if (state.lastMove) {
            $board.find(".square-" + state.lastMove.from).addClass("highlight-lastmove");
            $board.find(".square-" + state.lastMove.to).addClass("highlight-lastmove");
        }
    },
    initBoard: function() {
        $board = $('#board');
        // @ts-ignore
        state.board = Chessboard("board", {
            draggable: true,
            pieceTheme: "img/{piece}.svg",
            position: state.game.fen(),
            orientation: (state.blackAddr === state.selfAddr) ? "black" : "white",
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: this.onSnapEnd.bind(this),
            showErrors: "console"
        });
        this.setHighlight();

        $(window).resize(() => {
            state.board.resize();
            this.setHighlight();
        });
    },
    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    onSnapEnd: function() {
        state.board.position(state.game.fen());
        this.setHighlight();
    },
};

function getStatus() {
    const name = (state.game.turn() === "w")? m("div.tag.white", normalizeName(state.whiteName)) : m("div.tag.black", normalizeName(state.blackName));

    let status;
    if (state.game.isCheckmate()) {
        const winner = (state.game.turn() === "b")? m("div.tag.white", normalizeName(state.whiteName)) : m("div.tag.black", normalizeName(state.blackName));
        status = ["Game over, ", name, " is in checkmate, ", winner, " wins"];
    } else if (state.surrenderAddr && !state.inReplayMode) {
        const winner = (state.game.turn() === "b")? m("div.tag.white", normalizeName(state.whiteName)) : m("div.tag.black", normalizeName(state.blackName));
        status = ["Game over, ", name, " surrenders, ", winner, " wins"];
    } else if (state.game.isDraw()) {
        status = "Game over, drawn position";
    } else {  // game still on
        status = ["Turn: ", name];
        if (state.game.inCheck()) {
            status.push(" (in check)");
        }
    }
    return status;
}

function clearHighlight() {
    $board.find('.square-55d63').removeClass('highlight-lastmove');
}




function removeGreySquares() {
    $board.find(".square-55d63").css("background", "");
}


function greySquare(square) {
    let $square = $board.find(".square-" + square);
    $square.css("background", $square.hasClass("black-3c85d") ? "#696969" : "#a9a9a9");
}


function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (state.inReplayMode || state.surrenderAddr || state.game.isGameOver()) return false;

    const addr = state.selfAddr;
    if ((state.game.turn() === "w" && (state.whiteAddr !== addr || piece.search(/^b/) !== -1)) ||
        (state.game.turn() === "b" && (state.blackAddr !== addr || piece.search(/^w/) !== -1))) {
        return false;
    }

    // get list of possible moves for this square
    const moves = state.game.moves({
        square: source,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    greySquare(source);
    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
}


function onDrop(source, target) {
    removeGreySquares();

    const move = {
        from: source,
        to: target,
        promotion: "q" // NOTE: always promote to a queen for simplicity
    };

    try {
        state.game.move(move);
    } catch (e) { // illegal move
        return "snapback";
    }

    state.lastMove = move;
    const desc = "Chess: " + source + "-" + target,
          update = {payload: {move: move}, summary: getSummary()};
    if (state.game.isGameOver()) {
        update.info = "Chess: " + update.summary;
    }
    window.webxdc.sendUpdate(update, desc)
 }

function replay() {
    state.inReplayMode = true;
    const history = state.game.history();
    state.game.reset();
    state.board.position('start');
    clearHighlight();
    var i = 0;

    function runTurn() {
        setTimeout(function() {
            state.game.move(history[i]);
            state.board.position(state.game.fen());
            m.redraw();
            i++;
            if (i < history.length) {
                runTurn();
            } else {
                state.inReplayMode = false;
                m.redraw();
            }
        }, 1500)
    }

    runTurn();
}

function share() {
    state.game.header('White', state.whiteName, 'Black', state.blackName);
    window.webxdc.sendToChat({file:{name: "game.pgn", plainText: state.game.pgn()}, text: getSummary()});
}

function surrender() {
    if (state.surrenderAddr) {
        console.log("Warning: ignoring call to surrender()");
        return;
    }

    const winner = normalizeName((state.game.turn() === "b")? state.whiteName : state.blackName);
    const update = {
        payload: {surrenderAddr: state.selfAddr},
        summary: normalizeName(window.webxdc.selfName) + " surrenders, " + winner + " wins"
    };
    update.info = "Chess: " + update.summary;
    const desc = "Chess: " + update.summary;
    window.webxdc.sendUpdate(update, desc);
}
