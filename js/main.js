// @ts-check
import { normalizeName, state, getSummary } from "./common.js";
import { BoardComponent } from "./components/board.js";
import { HomeComponent } from "./components/home.js";
import m from "mithril";

function receiveUpdate(update) {
  const payload = update.payload;
  if (payload.move) {
    if (state.board && update.serial === update.max_serial) {
      const lastMove = state.lastMove || {};
      if (
        lastMove.from !== payload.move.from ||
        lastMove.to !== payload.move.to
      ) {
        // the move is not from self
        state.game.move(payload.move);
        state.lastMove = payload.move;
        state.board.position(state.game.fen());
        BoardComponent.setHighlight();
      }
    } else {
      state.game.move(payload.move);
      state.lastMove = payload.move;
    }
  } else if (payload.surrenderAddr) {
    state.surrenderAddr = payload.surrenderAddr;
  } else if (payload.whiteAddr && !state.whiteAddr) {
    state.whiteAddr = payload.whiteAddr;
    state.whiteName = payload.whiteName;
  } else if (
    !state.request &&
    payload.request &&
    payload.request === state.whiteAddr
  ) {
    state.request = payload;
  } else if (payload.blackAddr && !state.blackAddr) {
    state.blackAddr = payload.blackAddr;
    state.blackName = payload.blackName;
  }

  if (update.serial === update.max_serial) {
    if (
      !state.blackAddr &&
      state.request &&
      state.selfAddr === state.whiteAddr
    ) {
      state.blackAddr = state.request.addr;
      state.blackName = state.request.name;
      const desc = normalizeName(state.blackName) + " joined the game";
      const update = {
        payload: {
          blackAddr: state.blackAddr,
          blackName: state.blackName,
        },
        summary: getSummary(),
      };
      window.webxdc.sendUpdate(update, desc);
    }
    m.redraw();
  }
}

onload = () => {
  m.mount(document.getElementById("root"), {
    view: () => m(state.blackAddr ? BoardComponent : HomeComponent),
  });

  window.webxdc.setUpdateListener(receiveUpdate, 0);
};
