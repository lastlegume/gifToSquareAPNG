const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('convertScript', {
    chooseInputDir: ()=>ipcRenderer.invoke('chooseInputDir'),
    chooseOutputDir: ()=>ipcRenderer.invoke('chooseOutputDir'),
    convert: ()=>ipcRenderer.invoke("convert"),
    setkeepCompressedGifs: (keepCompressedGifs)=>ipcRenderer.send("setkeepCompressedGifs", keepCompressedGifs),
    setMaxSize: (maxSize)=>ipcRenderer.send("setMaxSize", maxSize),
    setShrinkingFactor: (shrinkingFactor)=>ipcRenderer.send("setShrinkingFactor", shrinkingFactor)

  })
