const BoardComponent = {
    view: () => [
        m("h3.sub", whiteName + " Vs. " + blackName),
        m("div#board"),
        m("h3.sub", status)
    ],
    oncreate: () => initBoard()
};


function initBoard() {
    $board = $('#board');
    board = Chessboard("board", {
        draggable: true,
        pieceTheme: "assets/img/{piece}.svg",
        position: game.fen(),
        orientation: (blackAddr === window.webxdc.selfAddr()) ? "black" : "white",
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
    $board.find('.square-55d63').removeClass('highlight-opponent');
    if (highlightMove) {
        $board.find(".square-" + highlightMove.from).addClass("highlight-opponent");
        $board.find(".square-" + highlightMove.to).addClass("highlight-opponent");
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

    const addr = window.webxdc.selfAddr();
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

    // see if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: "q" // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return "snapback";

    const desc = "Chess: " + source + "-" + target,
          update = {
              payload: {
                  whiteAddr: whiteAddr,
                  whiteName: whiteName,
                  blackAddr: blackAddr,
                  blackName: blackName,
                  lastMove: {from: source, to: target},
                  fen: game.fen()
              }
          };
    updateStatus();
    update.summary = status;
    if (game.game_over()) {
        update.info = "Chess: " + status;
    }
    window.webxdc.sendUpdate(update, desc)
 }


// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen());
}
