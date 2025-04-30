
// convert();
let gifInput = document.getElementById("gifInput");
let response = document.getElementById("response");
let inputDir = "";
let outputDir = "";
response.innerText = "Welcome. Choose an input and output directory to continue";

let convertButton = document.getElementById("convertButton");
let inputDirButton = document.getElementById("inputDirButton");
let outputDirButton = document.getElementById("outputDirButton");
let deleteGifsAfterCb = document.getElementById("deleteGifsAfterCb");
let maxSizeIn = document.getElementById("maxSize");



outputDirButton.addEventListener("click", async function () {
    outputDir = await window.convertScript.chooseOutputDir();
    console.log(outputDir);
    if (inputDir === outputDir) {
        response.innerText = "Input and output directories cannot be the same";
        convertButton.classList.add("hide");
    } else if (outputDir !== "") {
        convertButton.classList.remove("hide");
    }
});

inputDirButton.addEventListener("click", async function () {
    inputDir = await window.convertScript.chooseInputDir();
    console.log(inputDir);
    if (inputDir === outputDir) {
        response.innerText = "Input and output directories cannot be the same";
        convertButton.classList.add("hide");
    } else if (outputDir !== "") {
        convertButton.classList.remove("hide");
    }
});

convertButton.addEventListener("click", async function () {
    await window.convertScript.convert();
});

deleteGifsAfterCb.addEventListener("change", () => window.convertScript.setDeleteGifsAfter(deleteGifsAfterCb.checked))
maxSizeIn.addEventListener("change", () => window.convertScript.setMazSize(maxSizeIn.value))


window.convertScript.setDeleteGifsAfter(deleteGifsAfterCb.checked);
window.convertScript.setMazSize(maxSizeIn.value);