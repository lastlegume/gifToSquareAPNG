const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('convertScript', {
    chooseInputDir: ()=>ipcRenderer.invoke('chooseInputDir'),
    chooseOutputDir: ()=>ipcRenderer.invoke('chooseOutputDir'),
    convert: ()=>ipcRenderer.invoke("convert"),
    setDeleteGifsAfter: (deleteGifsAfter)=>ipcRenderer.send("setDeleteGifsAfter", deleteGifsAfter),
    setMaxSize: (maxSize)=>ipcRenderer.send("setMaxSize", maxSize)
  })
