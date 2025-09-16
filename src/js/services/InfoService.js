import ConfigService from "./ConfigService";

/**
 * Class the handle the information about the whiteboard
 */
class InfoService {
    /**
     * @type {boolean}
     */
    #infoAreDisplayed = false;
    get infoAreDisplayed() {
        return this.#infoAreDisplayed;
    }

    /**
     * Holds the number of user connected to the server
     *
     * @type {number}
     */
    #nbConnectedUsers = -1;
    get nbConnectedUsers() {
        return this.#nbConnectedUsers;
    }

    /**
     * @type {{w: number, h: number}}
     */
    #smallestScreenResolution = undefined;
    get smallestScreenResolution() {
        return this.#smallestScreenResolution;
    }

    /**
     * @type {number}
     */
    #nbMessagesSent = 0;
    get nbMessagesSent() {
        return this.#nbMessagesSent;
    }

    /**
     * @type {number}
     */
    #nbMessagesReceived = 0;
    get nbMessagesReceived() {
        return this.#nbMessagesReceived;
    }

    /**
     * Holds the interval Id
     * @type {number}
     */
    #refreshInfoIntervalId = undefined;
    get refreshInfoIntervalId() {
        return this.#refreshInfoIntervalId;
    }

    #displayInfoTime = new Date();

    /**
     * @param {number} nbConnectedUsers
     * @param {{w: number, h: number}} smallestScreenResolution
     */
    updateInfoFromServer({ nbConnectedUsers, smallestScreenResolution = undefined }) {
        if (this.#nbConnectedUsers !== nbConnectedUsers) {
            // Refresh config service parameters on nb connected user change
            ConfigService.refreshUserCountDependant(nbConnectedUsers);
        }
        this.#nbConnectedUsers = nbConnectedUsers;
        if (smallestScreenResolution) {
            this.#smallestScreenResolution = smallestScreenResolution;
        }
    }

    incrementNbMessagesReceived() {
        this.#nbMessagesReceived++;
    }

    incrementNbMessagesSent() {
        this.#nbMessagesSent++;
    }

    refreshDisplayedInfo() {
        const now = new Date();
        if (now - this.displayInfoTime < 10000) return;
        this.displayInfoTime = now;
        const {
            nbMessagesReceived,
            nbMessagesSent,
            nbConnectedUsers,
            smallestScreenResolution: ssr,
        } = this;
        console.log(
            `Info: messageReceived=${nbMessagesReceived}, messageSent=${nbMessagesSent}, connectedUsers=${nbConnectedUsers}, smallestScreenResolution=` +
                (ssr ? `(${ssr.w}, ${ssr.h})` : "Unknown")
        );
    }

    /**
     * Show the info div
     */
    displayInfo() {
        $("#whiteboardInfoContainer").toggleClass("displayNone", false);
        $("#displayWhiteboardInfoBtn").toggleClass("active", true);
        this.#infoAreDisplayed = true;

        this.refreshDisplayedInfo();
        this.#refreshInfoIntervalId = setInterval(() => {
            // refresh only on a specific interval to reduce
            // refreshing cost
            this.refreshDisplayedInfo();
        }, ConfigService.refreshInfoInterval);
    }

    /**
     * Hide the info div
     */
    hideInfo() {
        $("#whiteboardInfoContainer").toggleClass("displayNone", true);
        $("#displayWhiteboardInfoBtn").toggleClass("active", false);
        this.#infoAreDisplayed = false;
        const { refreshInfoIntervalId } = this;
        if (refreshInfoIntervalId) {
            clearInterval(refreshInfoIntervalId);
            this.#refreshInfoIntervalId = undefined;
        }
    }

    /**
     * Switch between hiding and showing the info div
     */
    toggleDisplayInfo() {
        const { infoAreDisplayed } = this;
        if (infoAreDisplayed) {
            this.hideInfo();
        } else {
            this.displayInfo();
        }
    }
}

export default new InfoService();
