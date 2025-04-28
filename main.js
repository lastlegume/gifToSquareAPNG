//from https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
//const { app, BrowserWindow } = require('electron')
const path = require('node:path')
//const { dialog } = require('electron');
var win = "";
var dirs = ["",""];
let deleteGifsAfter = false;

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
        dirs[0] = filePaths[0]+"\\";
        if(canceled)
            return "";
        else
            return filePaths[0];
    });
    //choose output directory
    ipcMain.handle('chooseOutputDir', async function () {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        });
        dirs[1] = filePaths[0]+"\\";
        if(canceled)
            return "";
        else
            return filePaths[0];
    });
    ipcMain.handle('convert', function(){if(dirs[0]!==""&&dirs[1]!=="") convert();});
    ipcMain.on('setDeleteGifsAfter', (val)=>deleteGifsAfter = val);

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
//const imageSize = require('image-size/fromFile');



async function convert() {
    console.log("convert");
    let filenames = fs.readdirSync(dirs[0]);
    for (let i = 0; i < filenames.length; i++) {
      let file = filenames[i];
      console.log(file); 
      if (deleteGifsAfter) {
        let dimensions = await imageSize.imageSizeFromFile(dirs[0] + file);
        let maxDim = Math.max(dimensions.width, dimensions.height);
        await (sharp(dirs[0] + file, { animated: true }).resize(maxDim, maxDim, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })).gif({ loop: 0 }).toFile(dirs[1] + i + ".gif");
        await toApng(dirs[1] + i + ".gif");
      } else {
        imageSize.imageSizeFromFile(dirs[0] + file).then(dimensions => {
          let maxDim = Math.max(dimensions.width, dimensions.height);
          (sharp(dirs[0] + file, { animated: true }).resize(maxDim, maxDim, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })).gif({ loop: 0 }).toFile(dirs[1] + i + ".gif").then(e => {
            toApng(dirs[1] + i + ".gif");
          });
        }
        );
      }
  
  
    }
    if (deleteGifsAfter) {
      filenames = fs.readdirSync(dirs[1]);
  
      for (let i = 0; i < filenames.length; i++) {
        if (filenames[i].split(".")[1] === "gif")
          fs.unlink(dirs[1] + filenames[i], (err) => {
            if (err) console.log('error with ' + filenames[i]);
          });
  
      }
    }
  
  }
  