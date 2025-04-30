//from https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
//const { app, BrowserWindow } = require('electron')
const path = require('node:path')
//const { dialog } = require('electron');
var win = "";
var dirs = ["", ""];
let deleteGifsAfter = false;
let maxSize = 330;

const createWindow = () => {
  win = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  //choose input directory
  ipcMain.handle('chooseInputDir', async function () {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    dirs[0] = filePaths[0] + "\\";
    if (canceled)
      return "";
    else
      return filePaths[0];
  });
  //choose output directory
  ipcMain.handle('chooseOutputDir', async function () {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    dirs[1] = filePaths[0] + "\\";
    if (canceled)
      return "";
    else
      return filePaths[0];
  });
  ipcMain.handle('convert', function () { if (dirs[0] !== "" && dirs[1] !== "") convert(); });
  ipcMain.on('setDeleteGifsAfter', (val) => deleteGifsAfter = val);
  ipcMain.on('setMaxSize', (val) => maxSize = val);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


const toApng = require("@beenotung/gif-to-apng");
const sharp = require("sharp");
const fs = require("fs");

async function convert() {
  console.log("convert");
  let filenames = fs.readdirSync(dirs[0]);
  let toBeDeleted = [];
  for (let i = 0; i < filenames.length; i++) {
    let file = filenames[i];
    console.log(file);
    let fSplit = file.split(".");
    if (fSplit[1]==="gif"&&!toBeDeleted.includes(fSplit[0])) {
      if (deleteGifsAfter) {
        //let dimensions = await imageSize.imageSizeFromFile(dirs[0] + file);
        //let maxDim = Math.max(dimensions.width, dimensions.height);
        let f = (sharp(dirs[0] + file, { animated: true }));
        let metadata = await f.metadata();
        let maxDim = Math.max(metadata.width * 1, Math.ceil(metadata.height / metadata.pages));
        //console.log(metadata.width+" "+metadata.height+" "+metadata.pages);

        let fileBuffer;
        await f.gif({ loop: 0 }).toFile(dirs[1] + i +"_original" + ".gif");
        do {
          fileBuffer = await (f.resize(maxDim, maxDim, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })).gif({ loop: 0 }).toBuffer();
          maxDim = Math.round(maxDim*7/8);
          f = sharp(fileBuffer, { animated: true });
          metadata = await f.metadata();
          console.log(metadata.size);
        } while(metadata.size>=maxSize*1000)
        
        await f.gif({ loop: 0 }).toFile(dirs[1] + i + "_compressed.gif");
        await toApng(dirs[1] + i + "_compressed.gif");
        toBeDeleted.push(i+"_compressed");
        toBeDeleted.push(i+"_original");

      } else {
        let f = (sharp(dirs[0] + file, { animated: true }));

        f.metadata().then(dimensions => {
          let maxDim = Math.max(dimensions.width, dimensions.height);
          (f.resize(maxDim, maxDim, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })).gif({ loop: 0 }).toFile(dirs[1] + i + ".gif").then(e => {
            toApng(dirs[1] + i + ".gif");
          });
        }
        );
      }

    }
  }
  if (deleteGifsAfter) {
    filenames = fs.readdirSync(dirs[1]);
    for (let i = 0; i < filenames.length; i++) {
      let split = filenames[i].split(".");
      if (split[1] === "gif" && toBeDeleted.includes(""+split[0]))
        fs.unlink(dirs[1] + filenames[i], (err) => {
          if (err) console.log('error with ' + filenames[i]);
        });

    }
  }
  console.log("done")
}
