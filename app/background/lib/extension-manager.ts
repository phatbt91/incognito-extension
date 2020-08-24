import ExtensionPlatform from "./extension"
import { createLogger } from "../../core/utils"

const log = createLogger("sol:ext")

const NOTIFICATION_HEIGHT = 600
const NOTIFICATION_WIDTH = 470

export class ExtensionManager {
  private platform: any
  private _popupId: any

  constructor() {
    this.platform = new ExtensionPlatform()
  }

  async closePopup() {
    const popup = await this._getPopup()
    log("closing popup: %O", popup)

    if (popup) {
      await this.platform.closeWindow(popup.id)
      log("popup closed")
    }
  }

  async showPopup(notifyPopup: () => void) {
    await this.closePopup()
    let left = 0
    let top = 0
    try {
      const lastFocused = await this.platform.getLastFocusedWindow()
      // Position window in top right corner of lastFocused window.
      top = lastFocused.top
      left = lastFocused.left + (lastFocused.width - NOTIFICATION_WIDTH)
    } catch (_) {
      // The following properties are more than likely 0, due to being
      // opened from the background chrome process for the extension that
      // has no physical dimensions
      const { screenX, screenY, outerWidth } = window
      top = Math.max(screenY, 0)
      left = Math.max(screenX + (outerWidth - NOTIFICATION_WIDTH), 0)
    }
    // create new notification popup
    const popupWindow = await this.platform.openWindow({
      url: "index.html",
      type: "popup",
      width: NOTIFICATION_WIDTH,
      height: NOTIFICATION_HEIGHT,
      left,
      top,
    })

    // Firefox currently ignores left/top for create, but it works for update
    if (popupWindow.left !== left && popupWindow.state !== "fullscreen") {
      // await this.platform.updateWindowPosition(popupWindow.id, left, top)
    }
    log("Shown popup, storing popup id %s", popupWindow.id)
    this._popupId = popupWindow.id
  }

  async _getPopup() {
    const windows = await this.platform.getAllWindows()
    return this._getPopupIn(windows)
  }

  _getPopupIn(windows: chrome.windows.Window[]) {
    return windows
      ? windows.find((win) => {
          log(
            "_getPopupIn: find: type: '%s' id: '%s' popupId: '%s'",
            win.type,
            win.id,
            this._popupId
          )
          return win && win.type === "popup" && win.id === this._popupId
        })
      : null
  }
}
