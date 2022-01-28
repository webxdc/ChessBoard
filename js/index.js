let board,
    game,
    status = undefined,
    whiteAddr = undefined,
    whiteName = undefined,
    blackAddr = undefined,
    blackName = undefined,
    highlightMove = undefined;


function receiveUpdate(update) {
    const payload = update.payload;
    loadState(payload);
    if (payload.fen) {
        const addr = window.webxdc.selfAddr;
        const fromSelf = ((game.turn() === "b" && whiteAddr === addr) ||
                          (game.turn() === "w" && blackAddr === addr));
        // state only needs to be updated when opponent moved
        if (!fromSelf) {
            board.position(payload.fen);
        }
        setHighlight();
    }
    m.redraw();
}


function loadState(payload) {
    whiteAddr = payload.whiteAddr;
    whiteName = payload.whiteName;
    blackAddr = payload.blackAddr;
    blackName = payload.blackName;

    if (payload.fen) {
        highlightMove = payload.lastMove;
        game.load(payload.fen);
    }
    updateStatus();
}


function joinGame() {
    const addr = window.webxdc.selfAddr;
    const name = window.webxdc.selfName;
    const update = {
        payload: {
            whiteAddr: whiteAddr,
            whiteName: whiteName,
            blackAddr: blackAddr,
            blackName: blackName
        }
    };
    if (!whiteAddr) {
        update.payload.whiteAddr = addr;
        update.payload.whiteName = name;
        update.summary = name + " is waiting for an opponent";
    } else if (!blackAddr && whiteAddr !== addr) {
        update.payload.blackAddr = addr;
        update.payload.blackName = name;
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
    $("body").append('<footer id="footer">v0.1</footer>');

    game = new Chess();

    window.webxdc.getAllUpdates().then((updates) => {
        // load game state
        if (updates.length > 0) {
            const payload = updates[updates.length - 1].payload;
            loadState(payload);
        }

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
