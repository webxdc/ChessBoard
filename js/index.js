let board,
    game,
    whiteAddr = undefined,
    whiteName = undefined,
    blackAddr = undefined,
    blackName = undefined,
    surrenderAddr = undefined,
    lastMove = undefined;


function receiveUpdate(update) {
    const payload = update.payload;
    if (payload.move) {
        if (lastMove !== payload.move) {  // the move is not from self
            game.move(payload.move);
            lastMove = payload.move;
            board.position(game.fen());
            setHighlight();
        }
    } else if (payload.surrenderAddr) {
        surrenderAddr = payload.surrenderAddr;
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
        update.summary = normalizeName(name) + " is waiting for an opponent";
    } else if (!blackAddr && whiteAddr !== addr) {
        update.payload = {blackAddr: addr, blackName: name};
        update.summary = getSummary();
    } else {
        console.log("Warning: ignoring call to joinGame()");
        return;
    }
    const desc = "Chess: " + normalizeName(name) + " joined the game";
    window.webxdc.sendUpdate(update, desc);
}


function surrender() {
    if (surrenderAddr) {
        console.log("Warning: ignoring call to surrender()");
        return;
    }

    const winner = normalizeName((game.turn() === "b")? whiteName : blackName);
    const update = {
        payload: {surrenderAddr: window.webxdc.selfAddr},
        summary: normalizeName(window.webxdc.selfName) + " surrenders, " + winner + " wins"
    };
    update.info = "Chess: " + update.summary;
    const desc = "Chess: " + update.summary;
    window.webxdc.sendUpdate(update, desc);
}

function normalizeName(name) {
    return name.length > 16 ? name.substring(0, 16) + '…' : name;
}


function getSummary() {
    const name = normalizeName((game.turn() === "w")? whiteName : blackName);

    let summary;
    if (game.in_checkmate()) {
        const winner = normalizeName((game.turn() === "b")? whiteName : blackName);
        summary = "Game over, " + name + " is in checkmate, " + winner + " wins";
    } else if (game.in_draw()) {
        summary = "Game over, drawn position";
    } else {  // game still on
        summary = "Turn: " + name;
        if (game.in_check()) {
            summary += " (in check)";
        }
    }
    return summary;
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
            } else if (payload.surrenderAddr) {
                surrenderAddr = payload.surrenderAddr;
            } else if (payload.whiteAddr && !whiteAddr) {
                whiteAddr = payload.whiteAddr;
                whiteName = payload.whiteName;
            } else if (payload.blackAddr && !blackAddr) {
                blackAddr = payload.blackAddr;
                blackName = payload.blackName;
            }
        });

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
                            m("h3.sub", [
                                m("div.tag.white", normalizeName(whiteName)),
                                " is waiting for opponent..."
                            ])
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
