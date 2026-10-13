// Live reload transport of the frontend development server (see scripts/server-frontend-dev.js).
// Only bundled by `npm run start:dev`, never into the production build.
import WebSocketClient from "webpack-dev-server/client/clients/WebSocketClient.js";

/**
 * Put the directory of the current page in front of the path of the dev server socket.
 * The dev server only knows the absolute path "/ws"; behind a reverse proxy that serves the
 * whiteboard under a sub path (e.g. /whiteboard/) the socket is reachable at /whiteboard/ws.
 * @param {string} socketUrl URL computed by the dev server client, e.g. "wss://host/ws"
 * @param {string} pagePath location.pathname of the page or worker, e.g. "/whiteboard/"
 * @returns {string} e.g. "wss://host/whiteboard/ws"
 */
export function prefixSocketPathWithPageDir(socketUrl, pagePath) {
    const url = new URL(socketUrl);
    const pageDir = pagePath.substring(0, pagePath.lastIndexOf("/"));
    url.pathname = pageDir + url.pathname;
    return url.toString();
}

export default class DevServerWebSocketClient extends WebSocketClient {
    constructor(url) {
        super(prefixSocketPathWithPageDir(url, self.location.pathname));
    }
}
