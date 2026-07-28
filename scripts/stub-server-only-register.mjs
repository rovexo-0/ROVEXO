/**
 * Stub `server-only` for Node CLI scripts (tsx uses CJS require for the package).
 */
import Module from "node:module";

const originalLoad = Module._load;
Module._load = function patchedLoad(request) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, arguments);
};
