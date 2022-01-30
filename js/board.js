const BoardComponent = {
    view: () => {
        return m("div#board-container", [
            m("h3.sub", [
                m("div.tag.white", normalizeName(whiteName)),
                " Vs. ",
                m("div.tag.black", normalizeName(blackName))
            ]),
            m("div#board"),
            m("h3.sub", getStatus())
        ]);
    },
    oncreate: () => initBoard()
};


function getStatus() {
    const name = (game.turn() === "w")? m("div.tag.white", normalizeName(whiteName)) : m("div.tag.black", normalizeName(blackName));

    let status;
    if (game.in_checkmate()) {
        const winner = (game.turn() === "b")? m("div.tag.white", normalizeName(whiteName)) : m("div.tag.black", normalizeName(blackName));
        status = ["Game over, ", name, " is in checkmate, ", winner, " wins"];
    } else if (game.in_draw()) {
        status = "Game over, drawn position";
    } else {  // game still on
        status = ["Turn: ", name];
        if (game.in_check()) {
            status.push(" (in check)");
        }
    }
    return status;
}


function initBoard() {
    $board = $('#board');
    board = Chessboard("board", {
        draggable: true,
        pieceTheme: "assets/img/{piece}.svg",
        position: game.fen(),
        orientation: (blackAddr === window.webxdc.selfAddr) ? "black" : "white",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        showErrors: "console"
    });
    setHighlight();

    $(window).resize(() => {
        board.resize();
        setHighlight();
    });
}


function setHighlight() {
    $board.find('.square-55d63').removeClass('highlight-lastmove');
    if (lastMove) {
        $board.find(".square-" + lastMove.from).addClass("highlight-lastmove");
        $board.find(".square-" + lastMove.to).addClass("highlight-lastmove");
    }
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
    if (game.game_over()) return false;

    const addr = window.webxdc.selfAddr;
    if ((game.turn() === "w" && (whiteAddr !== addr || piece.search(/^b/) !== -1)) ||
        (game.turn() === "b" && (blackAddr !== addr || piece.search(/^w/) !== -1))) {
        return false;
    }

    // get list of possible moves for this square
    const moves = game.moves({
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

    // illegal move
    if (game.move(move) === null) return "snapback";

    lastMove = move;
    const desc = "Chess: " + source + "-" + target,
          update = {payload: {move: move}};
    update.summary = getSummary();
    if (game.game_over()) {
        update.info = "Chess: " + update.summary;
    }
    window.webxdc.sendUpdate(update, desc)
 }


// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen());
    setHighlight();
}
