let board,
    game,
    status = undefined,
    whiteAddr = undefined,
    whiteName = undefined,
    blackAddr = undefined,
    blackName = undefined,
    lastMove = undefined;


function receiveUpdate(update) {
    const payload = update.payload;
    if (payload.move) {
        if (lastMove !== payload.move) {  // the move is not from self
            game.move(payload.move);
            lastMove = payload.move;
            board.position(game.fen());
            setHighlight();
            updateStatus();
        }
    } else if (payload.whiteAddr && !whiteAddr) {
        whiteAddr = payload.whiteAddr;
        whiteName = payload.whiteName;
    } else if (payload.blackAddr && !blackAddr) {
        blackAddr = payload.blackAddr;
        blackName = payload.blackName;
    }
    m.redraw();
}


function joinGame() {
    const addr = window.webxdc.selfAddr;
    const name = window.webxdc.selfName;
    const update = {};
    if (!whiteAddr) {
        update.payload = {whiteAddr: addr, whiteName: name};
        update.summary = name + " is waiting for an opponent";
    } else if (!blackAddr && whiteAddr !== addr) {
        update.payload = {blackAddr: addr, blackName: name};
        updateStatus();
        update.summary = status;
    } else {
        console.log("Warning: ignoring call to joinGame()");
        return;
    }
    const desc = "Chess: " + name + " joined the game.";
    window.webxdc.sendUpdate(update, desc);
}


function updateStatus() {
    const name = (game.turn() === "w")? whiteName : blackName;

    if (game.in_checkmate()) {
        status = "Game over, " + name + " is in checkmate";
    } else if (game.in_draw()) {
        status = "Game over, drawn position";
    } else {  // game still on
        status = "Turn: " + name;
        if (game.in_check()) {
            status += " (in check)";
        }
    }
}


$(() => {
    game = new Chess();

    window.webxdc.getAllUpdates().then((updates) => {
        // load game state
        updates.forEach((update) => {
            const payload = update.payload;
            if (payload.move) {
                if (game.move(payload.move)) {
                    lastMove = payload.move;
                }
            } else if (payload.whiteAddr && !whiteAddr) {
                whiteAddr = payload.whiteAddr;
                whiteName = payload.whiteName;
            } else if (payload.blackAddr && !blackAddr) {
                blackAddr = payload.blackAddr;
                blackName = payload.blackName;
            }
        });
        updateStatus();

        const root = document.getElementById("app");
        const HomeComponent = {
            view: () => {
                let div = m("div#home");
                div.children.push(
                    m("img#app-icon", {src: "assets/img/bK.svg"}),
                    m("h1#app-name", "Chess Board")
                );
                if (whiteAddr === window.webxdc.selfAddr) {
                    div.children.push(
                        m("h3.sub", "Waiting for opponent...")
                    );
                } else {
                    if (whiteAddr) {
                        div.children.push(
                            m("h3.sub", whiteName + " is waiting for opponent...")
                        );
                    }
                    div.children.push(
                        m("a#join-btn", {
                            class: "btn",
                            onclick: () => joinGame()
                        }, "Join Game")
                    );
                }
                return div;
            }
        };
        m.mount(root, {
            view: () => m(blackAddr? BoardComponent : HomeComponent)
        });

        window.webxdc.setUpdateListener(receiveUpdate);
    });
});
