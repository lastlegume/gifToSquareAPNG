//from https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
//const { app, BrowserWindow } = require('electron')
const path = require('node:path')
//const { dialog } = require('electron');
var win = "";
var dirs = ["", ""];
//name is an artifact from when beenotung gif2apng wrapper was used
let keepCompressedGifs = false;
let keepUncompressedApngs = false;
let maxSize = 350;
let shrinkingFactor = 0.95;

const createWindow = () => {
  win = new BrowserWindow({
    width: 450,
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
  ipcMain.on('setkeepCompressedGifs', function (e, val) { keepCompressedGifs = val; console.log(val) });
  ipcMain.on('setkeepUncompressedApngs', function (e, val) { keepUncompressedApngs = val; console.log(val) });
  ipcMain.on('setMaxSize', function (e, val) { maxSize = Math.max(val, 100); console.log(val) });
  ipcMain.on('setShrinkingFactor', function (e, val) { shrinkingFactor = Math.max(Math.min(0.995, val), 0.5); console.log(shrinkingFactor) });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

//works before being packaged, but packaging with Electron Forge causes this module to throw an error and fail converting every GIF.
//const toApng = require("@beenotung/gif-to-apng");
const sharp = require("sharp");
const fs = require("fs");
const apng = require("sharp-apng");


// conversion functions

async function convert() {
  console.log("convert");
  if (keepCompressedGifs && !fs.existsSync(dirs[1] + "gifs"))
    fs.mkdirSync(dirs[1] + "gifs");
  if (keepUncompressedApngs && !fs.existsSync(dirs[1] + "uncompressedAPNGs"))
    fs.mkdirSync(dirs[1] + "uncompressedAPNGs");
  // else if(!fs.existsSync(dirs[1] + "temp_gifToApng"))
  //   fs.mkdirSync(dirs[1] + "temp_gifToApng");
  let filenames = fs.readdirSync(dirs[0]);
  for (let i = 0; i < filenames.length; i++) {
    try {
      let file = filenames[i];
      console.log(file);
      let fSplit = file.split(".");
      let f;

      function decide(metadata) {
        console.log(Math.ceil(metadata.size / 1000) + "kb size for " + fSplit[0]);
        if (metadata.size >= maxSize * 1000 * ((fSplit[1]==="png")?(0.75):(1.0)))
          f.metadata().then((metadata) => shrink(metadata));
        else {
          apng.sharpToApng(
            f, dirs[1] + fSplit[0] + "_compressed.png"
          );
          if (keepCompressedGifs)
            f.gif({ loop: 0 }).toFile(dirs[1] + "gifs/" + fSplit[0] + "_compressed.gif");  //.then(convertToApng);//.toBuffer((buf)=>saveFile(buf));
        }
      }
      function getMetadata(buffer) {
        f = sharp(buffer, { animated: true });
        console.log("getting metadata for " + fSplit[0]);
        f.metadata().then((metadata) => decide(metadata));
      }
      function box(metadata) {
        let maxDim = Math.max(metadata.width, Math.ceil(metadata.height / metadata.pages));
        console.log(maxDim + "px box");
        (f.resize(maxDim, maxDim, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })).gif({ loop: 0 }).toFormat('gif').toBuffer().then((buffer) => getMetadata(buffer));
      }
      function shrink(metadata) {
        let maxDim = Math.max(metadata.width, Math.ceil(metadata.height / metadata.pages));
        console.log(maxDim + "px shrink for " + fSplit[0]);
        (f.resize(Math.round(maxDim * shrinkingFactor), Math.round(maxDim * shrinkingFactor), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })).gif({ loop: 0 }).toFormat('gif').toBuffer().then((buffer) => getMetadata(buffer));
      }

      if (fSplit[1] === "gif") {
        f = (sharp(dirs[0] + file, { animated: true, transparent: true }));
        f.metadata().then((m) => box(m));

        if (keepUncompressedApngs) {
          let path = dirs[1] + "uncompressedAPNGs/" + fSplit[0] + ".png";
          apng.sharpToApng((sharp(dirs[0] + file, { animated: true, transparent: true })), path);
        }
      } else if (fSplit[1] === "png") {
        apng.sharpFromApng(dirs[0] + file, { animated: true, transparent: true }).then(function (img) {
          f = img;
          f.metadata().then((m) => box(m));
        });
      }

    } catch (error) {
      console.log(error);
    }
  }

  console.log("done");
  // if(!keepUncompressedApngs)
     //setTimeout(function(){console.log("probably done")}, 30000+filenames.length*500);
  return "done";
}


// function convertToApng() {
//   toApng(dirs[1] + i + "_compressed.gif");
// }
// function saveFile(buffer){

//   sharp(buffer, { animated: true })
// }


//synchronous version (no longer necessary)
// if (keepCompressedGifs) {
//   //let dimensions = await imageSize.imageSizeFromFile(dirs[0] + file);
//   //let maxDim = Math.max(dimensions.width, dimensions.height);
//   f = (sharp(dirs[0] + file, { animated: true }));
//   let metadata = await f.metadata();
//   let maxDim = Math.max(metadata.width * 1, Math.ceil(metadata.height / metadata.pages));
//   //console.log(metadata.width+" "+metadata.height+" "+metadata.pages);

//   let fileBuffer;
//   let count = 0;
//   do {
//     fileBuffer = await (f.resize(maxDim, maxDim, {
//       fit: 'contain',
//       background: { r: 0, g: 0, b: 0, alpha: 0 }
//     })).gif({ loop: 0 }).toBuffer();
//     maxDim = Math.round(maxDim * shrinkingFactor);
//     f = sharp(fileBuffer, { animated: true });
//     if(count==0)
//       await f.gif({ loop: 0 }).toFile(dirs[1] + i + "_original" + ".gif");
//     metadata = await f.metadata();
//     console.log(metadata.size);
//     count++;
//   } while (metadata.size >= maxSize * 1000)

//   await f.gif({ loop: 0 }).toFile(dirs[1] + i + "_compressed.gif");
//   await apng.sharpToApng(
//     f, dirs[1] + i + "_compressed.png"
//   );
//   //await toApng(dirs[1] + i + "_compressed.gif");
//   toBeDeleted.push(i + "_compressed.gif");
//   toBeDeleted.push(i + "_original.gif");

// } else {
//f.push("");


//   if (keepCompressedGifs) {
//     filenames = fs.readdirSync(dirs[1]);
//     // console.log(toBeDeleted);
//     // console.log(filenames);
//     for (let i = 0; i < filenames.length; i++) {
// //      let split = filenames[i].split(".");
//      // if (split[1] === "gif" && toBeDeleted.includes("" + split[0]))
//      if(toBeDeleted.includes("" + filenames[i]))
//         fs.unlink(dirs[1] + filenames[i], (err) => {
//           if (err) console.log('error with ' + filenames[i]);
//         });

//     }
//   }