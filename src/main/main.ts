/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const fs = require('fs');
var convert = require('xml-js');
const glob = require('glob');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('open-dialog-content', async (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    .then((result) => {
      // console.log(result.canceled);
      console.log(result.filePaths);
      event.reply('open-dialog-content', result.filePaths);
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('open-dialog-vop', async (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    .then((result) => {
      // console.log(result.canceled);
      console.log(result.filePaths);
      event.reply('open-dialog-vop', result.filePaths);
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('error-message', async (event, arg) => {
  console.log('-------- ERROR MESSAGE -------');
  console.log(arg);
});

ipcMain.on('get-clients', async (event, arg) => {
  fs.readFile(
    '/Users/piotrgryko/repos/integration_tool/integration_gui/nodegui/react-nodegui-starter/src/components/clientconfig.json',
    'utf8',
    (error, data) => {
      if (error) {
        event.reply('get-clients', error);
        return;
      }
      console.log(JSON.parse(data).clients);
      console.log('======== DUPA BLADA =========');
      event.reply('get-clients', JSON.parse(data).clients);
    }
  );
});

// ------------------ VALIDATE XML -----------------

ipcMain.on('validate-xml', async (event, arg) => {

  console.log(arg[0])

  var files = fs.readdirSync(arg[0]).filter((fn) => fn.endsWith('.xml'));
  const xmlFile = arg[0] + '/' + files[0];

  fs.readFile(
    xmlFile,
    'utf8',
    (error, data) => {
      if (error) {
        event.reply('validate-xml', error);
        return;
      }
      var result = convert.xml2json(data, { compact: false, spaces: 4 });

      console.log(JSON.parse(result).elements[1].elements);
      event.reply('validate-xml', JSON.parse(result).elements[1].elements);
    }
  );
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
