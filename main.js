//from https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
//const { app, BrowserWindow } = require('electron')
const path = require('node:path')
//const { dialog } = require('electron');
var win = "";
var dirs = ["", ""];
let deleteGifsAfter = false;
let maxSize = 350;
let shrinkingFactor = 0.95;

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
  ipcMain.on('setDeleteGifsAfter', function(e, val){ deleteGifsAfter = val;console.log(val)});
  ipcMain.on('setMaxSize', function(e, val){ maxSize = Math.max(val,100);console.log(val)});
  ipcMain.on('setShrinkingFactor', function(e, val){ shrinkingFactor = Math.max(Math.min(0.995,val),0.5);console.log(val)});
  
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
      let f = [];
      if (deleteGifsAfter) {
        //let dimensions = await imageSize.imageSizeFromFile(dirs[0] + file);
        //let maxDim = Math.max(dimensions.width, dimensions.height);
        f = (sharp(dirs[0] + file, { animated: true }));
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
          maxDim = Math.round(maxDim*shrinkingFactor);
          f = sharp(fileBuffer, { animated: true });
          metadata = await f.metadata();
          console.log(metadata.size);
        } while(metadata.size>=maxSize*1000)
        
        await f.gif({ loop: 0 }).toFile(dirs[1] + i + "_compressed.gif");
        await toApng(dirs[1] + i + "_compressed.gif");
        toBeDeleted.push(i+"_compressed");
        toBeDeleted.push(i+"_original");

      } else {
        f.push("");
        f[i] = (sharp(dirs[0] + file, { animated: true }));
        function convertToApng(){
          toApng(dirs[1] + i + "_compressed.gif");
        }
        // function saveFile(buffer){
          
        //   sharp(buffer, { animated: true })
        // }
        function decide(metadata){
          console.log(metadata.size+"b size "+i);
          if(metadata.size>=maxSize*1000)
            f[i].metadata().then((metadata)=>shrink(metadata));
          else
            f[i].gif({ loop: 0 }).toFile(dirs[1] + i + "_compressed.gif").then(convertToApng);//.toBuffer((buf)=>saveFile(buf));
        }
        function getMetadata(buffer){
          f[i] = sharp(buffer, { animated: true });
          console.log("getting metadata");
          f[i].metadata().then((metadata) => decide(metadata));
        }
        function box(metadata){
          let maxDim = Math.max(metadata.width, Math.ceil(metadata.height / metadata.pages));
          console.log(maxDim + " box");
          (f[i].resize(maxDim, maxDim, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })).gif({ loop: 0 }).toBuffer().then((buffer)=>getMetadata(buffer));
        }
      function shrink(metadata){
        let maxDim = Math.max(metadata.width, Math.ceil(metadata.height / metadata.pages));
        console.log(maxDim + " shrink "+i);
        (f[i].resize(Math.round(maxDim*shrinkingFactor), Math.round(maxDim*shrinkingFactor), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })).gif({ loop: 0 }).toBuffer().then((buffer)=>getMetadata(buffer));
      }

      console.log(f[i]);

      f[i].metadata().then((m)=>box(m));
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
