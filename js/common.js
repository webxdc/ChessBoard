// @ts-check
import { Chess } from "chess.js";
import jsSHA from "jssha";

export const state = {
  selfAddr: hashText(window.webxdc.selfAddr),
  whiteAddr: undefined,
  whiteName: undefined,
  blackAddr: undefined,
  blackName: undefined,
  request: undefined,
  surrenderAddr: undefined,
  lastMove: undefined,
  inReplayMode: false,
  board: undefined,
  game: new Chess(),
};

function hashText(text) {
  return new jsSHA("SHA-512", "TEXT", { encoding: "UTF8" })
    .update(text)
    .getHash("HEX");
}

export function normalizeName(name) {
  return name.length > 16 ? name.substring(0, 16) + "…" : name;
}

export function getSummary() {
  const name = normalizeName(
    state.game.turn() === "w" ? state.whiteName : state.blackName
  );

  let summary;
  if (state.game.isCheckmate()) {
    const winner = normalizeName(
      state.game.turn() === "b" ? state.whiteName : state.blackName
    );
    summary = "Game over, " + name + " is in checkmate, " + winner + " wins";
  } else if (state.surrenderAddr) {
    // used by "share" button
    const winner =
      state.game.turn() === "b"
        ? normalizeName(state.whiteName)
        : normalizeName(state.blackName);
    summary = "Game over, " + name + " surrenders, " + winner + " wins";
  } else if (state.game.isDraw()) {
    summary = "Game over, drawn position";
  } else {
    // game still on
    summary = "Turn: " + name;
    if (state.game.inCheck()) {
      summary += " (in check)";
    }
  }
  return summary;
}
