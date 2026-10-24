// Mock of the `electron` native module (not installed in this environment)
// so that electron/lib/localInference.js can be required for unit tests.
// Only the surface used by localInference.js is implemented.
const { EventEmitter } = require('node:events');

class BrowserWindow extends EventEmitter {
    constructor() {
        super();
        this.webContents = { send: () => {} };
        this.destroyed = false;
    }
    destroy() { this.destroyed = true; }
    isDestroyed() { return this.destroyed; }
    once() {}
    on() {}
    removeListener() {}
    loadFile() {}
    loadURL() {}
    show() {}
    hide() {}
    focus() {}
    blur() {}
    close() {}
    maximize() {}
    minimize() {}
    restore() {}
    setTitle() {}
    setSize() {}
    getSize() { return [800, 600]; }
    setResizable() {}
    setAlwaysOnTop() {}
    setSkipTaskbar() {}
    setIcon() {}
    setMenu() {}
    setAutoHideMenuBar() {}
    isMenuBarVisible() { return true; }
    setMenuBarVisibility() {}
    setProgressBar() {}
    setOverlayIcon() {}
}

module.exports = {
    ipcMain: {
        handle: () => {},
        on: () => {},
        once: () => {},
        removeHandler: () => {},
        removeListener: () => {},
    },
    app: {
        getPath: () => '/tmp/open-generative-ai-test',
        whenReady: () => Promise.resolve(),
        on: () => {},
        once: () => {},
        off: () => {},
        removeListener: () => {},
        isReady: () => true,
        quit: () => {},
        exit: () => {},
        getVersion: () => '0.0.0-test',
        getName: () => 'Open Generative AI Test',
    },
    BrowserWindow,
    shell: { openExternal: async () => {} },
    session: { fromPartition: () => ({}) },
    protocol: { registerFileProtocol: () => {}, registerBufferProtocol: () => {} },
};
