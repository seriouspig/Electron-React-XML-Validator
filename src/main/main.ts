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
const yaml = require('js-yaml');
const fastFolderSizeSync = require('fast-folder-size/sync');
const fse = require('fs-extra');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('open-dialog-content', async (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    .then((result) => {
      // Check if folder contains vopLoad_bluebox_inbox/metadata.yml or vopLoad_bluebox_inbox/metadata.yml
      var files = fs
        .readdirSync(result.filePaths[0])
        .filter((fn) => fn.startsWith('vopPackage_bluebox_'))
        .filter(fn => (['content','inbox'].some(char => fn.endsWith(char))));

              if (files.length < 1) {
                event.reply(
                  'open-dialog-content',
                  'Not a valid content / inbox ...'
                );
              } else {
                event.reply('open-dialog-content', result.filePaths);
              }
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
      // Check if folder contains vopLoad_bluebox_1.5.4.xml
      var files = fs
        .readdirSync(result.filePaths[0])
        .filter((fn) => fn.startsWith('vopLoad_bluebox_'))
        .filter((fn) => fn.endsWith('.xml'));

      if (files.length < 1) {
        event.reply(
          'open-dialog-vop',
          'Not a valid VOP, no xml file detected ...'
        );
      } else {
        event.reply('open-dialog-vop', result.filePaths);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('open-dialog-database', async (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Database', extensions: ['sql'] }],
    })
    .then((result) => {
      event.reply('open-dialog-database', result.filePaths);
    })
    .catch((err) => {
      console.log(err);
    });
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
      event.reply('get-clients', JSON.parse(data).clients);
    }
  );
});

// ------------------ VALIDATE XML -----------------

ipcMain.on('validate-xml', async (event, arg) => {
  const objArray = [];

  var files = fs.readdirSync(arg[0][0]).filter((fn) => fn.endsWith('.xml'));
  const xmlFile = arg[0][0] + '/' + files[0];

  fs.readFile(xmlFile, 'utf8', (error, data) => {
    if (error) {
      event.reply('validate-xml', error);
      return;
    }
    var result = convert.xml2json(data, { compact: false, spaces: 4 });

    var ymlDirs = fs
      .readdirSync(arg[0][0])
      .filter((dn) => dn.startsWith('vopPackage_bluebox'));

    var xmlObject = JSON.parse(result).elements[1].elements;

    xmlObject.map((value) =>
      objArray.push({
        xmlVersion: value.attributes.version,
        packageName: value.attributes.id,
        installTime: value.elements[1].attributes.seconds,
      })
    );

    var packageNames = [];
    xmlObject.map((value) => packageNames.push(value.attributes.id));

    objArray.map((value) => {
      if (ymlDirs.includes('vopPackage_' + value.packageName)) {
        // Get the size of each folder
        const bytes = fastFolderSizeSync(
          arg[0] + '/' + 'vopPackage_' + value.packageName
        );

        value.size = Math.round(bytes / 1000000);

        // Get the version from each folder
        const versionFile =
          arg[0][0] +
          '/' +
          'vopPackage_' +
          value.packageName +
          '/' +
          value.packageName.replace('bluebox_', '') +
          '/' +
          value.packageName.replace('bluebox_', '') +
          'version';

        if (fs.existsSync(versionFile))
          try {
            var data = fs.readFileSync(versionFile, 'utf8');

            value.version = data.toString();
          } catch (e) {
            console.log('Error:', e.stack);
          }
        else {
          value.version = '-';
        }

        // Read the packaged Version from each yml
        if (
          fs.existsSync(
            arg[0][0] +
              '/' +
              'vopPackage_' +
              value.packageName +
              '/metadata.yml'
          )
        )
          try {
            const doc = yaml.load(
              fs.readFileSync(
                arg[0][0] +
                  '/' +
                  'vopPackage_' +
                  value.packageName +
                  '/metadata.yml',
                'utf8'
              )
            );
            console.log(doc);

            value.ymlVersion = doc.packageVersion;

            //  obj[ymlDir.replace('vopPackage_', '')].ymlVersion =
            //    doc.packageVersion;
          } catch (e) {
            console.log(e);
          }
        else value.ymlVersion = '-';

        // ---------------------- CONTENT FOLDER PART
        // Read the packaged Version from each yml in the content folder
        if (
          fs.existsSync(
            arg[1][0] +
              '/' +
              'vopPackage_' +
              value.packageName +
              '/metadata.yml'
          )
        ) {
          // Do something

          try {
            const doc = yaml.load(
              fs.readFileSync(
                arg[1][0] +
                  '/' +
                  'vopPackage_' +
                  value.packageName +
                  '/metadata.yml',
                'utf8'
              )
            );
            console.log(doc);

            value.ymlContent = doc.packageVersion;
          } catch (e) {
            console.log(e);
          }
        } else {
          value.ymlContent = '-';
        }
      }
    });

    // Retur obj array

    console.log(objArray);

    event.reply('validate-xml', objArray);
  });
});

// --------------------------- Get package name and file name ---------

ipcMain.on('get-package-name', async (event, arg) => {
  console.log(arg);
  const packageName = path.basename(arg[0]);
  var files = fs
    .readdirSync(arg[0] + '/vopPackage_bluebox')
    .filter((fn) => fn.endsWith('.dop.gpg'));
  const replyObject = { packageName: '', dopName: '' };
  replyObject.packageName = packageName;
  replyObject.dopName = files[0];
  event.reply('get-package-name', replyObject);
});

// ------------------ MERGE -----------------

ipcMain.on('merge', async (event, arg) => {
  console.log(arg[0]);
  console.log('------ this is the VOP path: ');
  console.log(arg[0][0]);
  console.log('-------this is the content path: ');
  console.log(arg[1][0]);

  const srcDir = arg[1][0];
  const destDir = arg[0][0];

  // To copy a folder or file, select overwrite accordingly
  try {
    fse.copySync(srcDir, destDir, { overwrite: true });
    console.log('success!');
    event.reply('merge', 'Merge Successfull !!!');
  } catch (err) {
    console.error(err);
    event.reply('merge', 'Merge Failed !!!');
  }
});

ipcMain.on('check-database', async (event, arg) => {
  console.log(arg[0]);
  if (fs.existsSync(arg[0] + '/vopPackage_bluebox_inbox/inbox/bbdb.sql')) {
    event.reply('check-database', 'bbdb.sql found in inbox volume');
  } else {
    event.reply('check-database', 'NO bbdb.sql found in inbox volume !!!');
  }
});

ipcMain.on('add-database', async (event, arg) => {
  const srcDir = arg[0][0];
  const destDir = arg[1][0] + '/vopPackage_bluebox_inbox/inbox/bbdb.sql';

  // fs.copyFile('source.txt', 'destination.txt', (err) => {
  //   if (err) throw err;
  //   console.log('source.txt was copied to destination.txt');
  // });
  // To copy a folder or file, select overwrite accordingly
  try {
    fse.copyFile(srcDir, destDir);
    console.log('success!');
    event.reply('add-database', 'Database successfully added to inbox volume');
  } catch (err) {
    console.error(err);
    event.reply('add-database', 'Database add failed !!!');
  }
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
