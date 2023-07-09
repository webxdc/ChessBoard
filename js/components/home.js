// @ts-check
import {normalizeName, state} from "../common.js";
import m from "mithril";

export const HomeComponent = {
    view: () => {
        document.getElementById("root").style["align-items"] = "center";
        let div = m("div#home");
        div.children.push(
            m("img#app-icon", {src: "img/bK.svg"}),
            m("h1#app-name", "Chess Board")
        );
        if (state.whiteAddr === state.selfAddr) {
            div.children.push(
                m("h3.sub", "Waiting for opponent...")
            );
        } else {
            if (state.whiteAddr) {
                let status;
                if (state.request) {
                    if (state.request.addr === state.selfAddr) {
                        status = [
                            "Waiting for ",
                            m("div.tag.white", normalizeName(state.whiteName)),
                            " to accept..."
                        ];
                    } else {
                        status = [
                            m("div.tag.black", normalizeName(state.request.name)),
                            " requested to join ",
                            m("div.tag.white", normalizeName(state.whiteName)),
                        ];
                    }
                } else {
                    status = [
                        m("div.tag.white", normalizeName(state.whiteName)),
                        " is waiting for opponent..."
                    ];
                }
                div.children.push(m("h3.sub", status));
            }
            if (!state.request) {
                div.children.push(
                    m("a#join-btn", {
                        class: "btn",
                        onclick: () => joinGame()
                    }, state.whiteAddr? "Join Game" : "Start Game")
                );
            }
        }
        return div;
    }
};

function joinGame() {
    const name = window.webxdc.selfName;
    const update = {};
    if (!state.whiteAddr) {
        update.payload = {whiteAddr: state.selfAddr, whiteName: name};
        update.summary = normalizeName(name) + " is waiting for an opponent";
        window.webxdc.sendUpdate(update, "Chess: " + update.summary);
    } else if (!state.blackAddr && state.whiteAddr !== state.selfAddr) {
        update.payload = {request: state.whiteAddr, addr: state.selfAddr, name: name};
        update.summary = normalizeName(name) + " requested to join game";
        window.webxdc.sendUpdate(update, "Chess: " + update.summary);
    } else {
        console.log("Warning: ignoring call to joinGame()");
    }
}
