
// convert();
let gifInput = document.getElementById("gifInput");
let response = document.getElementById("response");
let inputDir = "";
let outputDir = "";
response.innerText = "init";

let convertButton = document.getElementById("convertButton");
let inputDirButton = document.getElementById("inputDirButton");
let outputDirButton = document.getElementById("outputDirButton");
let deleteGifsAfterCb = document.getElementById("deleteGifsAfterCb");
let deleteGifsAfter = deleteGifsAfterCb.checked; // needs to be a checkbox later

outputDirButton.addEventListener("click", async function(){
    outputDir = await window.convertScript.chooseOutputDir();
    console.log(outputDir);
});

inputDirButton.addEventListener("click", async function(){
    inputDir = await window.convertScript.chooseInputDir();
    console.log(inputDir);
});

convertButton.addEventListener("click", async function(){
    outputDir = await window.convertScript.convert();
    console.log(outputDir);
});

deleteGifsAfterCb.addEventListener("change", ()=>window.convertScript.setDeleteGifsAfter(deleteGifsAfterCb.checked))
window.convertScript.setDeleteGifsAfter(deleteGifsAfterCb.checked)