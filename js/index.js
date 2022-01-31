let board,
    game,
    whiteAddr = undefined,
    whiteName = undefined,
    blackAddr = undefined,
    blackName = undefined,
    request = undefined,
    surrenderAddr = undefined,
    lastMove = undefined,
    inReplayMode = false;


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
    } else if (!request && payload.request && payload.request === whiteAddr) {
        request = payload;
        if (window.webxdc.selfAddr === whiteAddr) {
            blackAddr = payload.addr;
            blackName = payload.name;
            const desc = "Chess: " + normalizeName(blackName) + " joined the game";
            const update = {
                payload: {
                    blackAddr: blackAddr,
                    blackName: blackName
                },
                summary: getSummary()
            };
            window.webxdc.sendUpdate(update, desc);
        }
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
        window.webxdc.sendUpdate(update, "Chess: " + update.summary);
    } else if (!blackAddr && whiteAddr !== addr) {
        update.payload = {request: whiteAddr, addr: addr, name: name};
        update.summary = normalizeName(name) + " requested to join game";
        window.webxdc.sendUpdate(update, "Chess: " + update.summary);
    } else {
        console.log("Warning: ignoring call to joinGame()");
    }
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


function replay() {
    inReplayMode = true;
    const history = game.history();
    game.reset();
    board.position('start');
    clearHighlight();
    var i = 0;

    function runTurn() {
        setTimeout(function() {
            game.move(history[i]);
            board.position(game.fen());
            m.redraw();
            i++;
            if (i < history.length) {
                runTurn();
            } else {
                inReplayMode = false;
                m.redraw();
            }
        }, 1500)
    }

    runTurn();
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
            } else if (!request && payload.request && payload.request === whiteAddr) {
                request = payload;
            } else if (payload.blackAddr && !blackAddr) {
                blackAddr = payload.blackAddr;
                blackName = payload.blackName;
            }
        });
        if (!blackAddr && request && window.webxdc.selfAddr === whiteAddr) {
            blackAddr = request.addr;
            blackName = request.name;
            const desc = "Chess: " + normalizeName(blackName) + " joined the game";
            const update = {
                payload: {
                    blackAddr: blackAddr,
                    blackName: blackName
                },
                summary: getSummary()
            };
            window.webxdc.sendUpdate(update, desc);
        }

        const root = document.getElementById("root");
        const HomeComponent = {
            view: () => {
                $("#root").css("align-items", "center");
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
                        let status;
                        if (request) {
                            if (request.addr == window.webxdc.selfAddr) {
                                status = [
                                    "Waiting for ",
                                    m("div.tag.white", normalizeName(whiteName)),
                                    " to accept..."
                                ];
                            } else {
                                status = [
                                    m("div.tag.black", normalizeName(request.name)),
                                    " requested to join ",
                                    m("div.tag.white", normalizeName(whiteName)),
                                ];
                            }
                        } else {
                            status = [
                                m("div.tag.white", normalizeName(whiteName)),
                                " is waiting for opponent..."
                            ];
                        }
                        div.children.push(m("h3.sub", status));
                    }
                    if (!request) {
                        div.children.push(
                            m("a#join-btn", {
                                class: "btn",
                                onclick: () => joinGame()
                            }, whiteAddr? "Join Game" : "Start Game")
                        );
                    }
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
