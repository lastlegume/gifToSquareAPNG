
// convert();
let gifInput = document.getElementById("gifInput");
let response = document.getElementById("response");
let inputDir = "";
let outputDir = "";
response.innerText = "Welcome. Choose an input and output directory to continue";

let convertButton = document.getElementById("convertButton");
let inputDirButton = document.getElementById("inputDirButton");
let outputDirButton = document.getElementById("outputDirButton");
let keepCompressedGifsCb = document.getElementById("keepCompressedGifsCb");
let maxSizeIn = document.getElementById("maxSize");
let shrinkingFactorIn = document.getElementById("shrinkingFactor");



outputDirButton.addEventListener("click", async function () {
    outputDir = await window.convertScript.chooseOutputDir();
    console.log(outputDir);
    if (inputDir === outputDir && outputDir !== "") {
        response.innerText = "Input and output directories cannot be the same";
        convertButton.classList.add("hide");
    } else if (outputDir !== "" && inputDir !== "") {
        convertButton.classList.remove("hide");
    }
});

inputDirButton.addEventListener("click", async function () {
    inputDir = await window.convertScript.chooseInputDir();
    console.log(inputDir);
    if (inputDir === outputDir && outputDir !== "") {
        response.innerText = "Input and output directories cannot be the same";
        convertButton.classList.add("hide");
    } else if (outputDir !== "" && inputDir !== "") {
        convertButton.classList.remove("hide");
    }
});

convertButton.addEventListener("click", async function () {
    response.innerText = "Conversion in progress... check output directory";
    await window.convertScript.convert();

});

keepCompressedGifsCb.addEventListener("change", () => window.convertScript.setkeepCompressedGifs(keepCompressedGifsCb.checked))
maxSizeIn.addEventListener("change", () => window.convertScript.setMaxSize(maxSizeIn.value*1))
shrinkingFactorIn.addEventListener("change", () => window.convertScript.setShrinkingFactor(shrinkingFactorIn.value*1))


window.convertScript.setkeepCompressedGifs(keepCompressedGifsCb.checked);
window.convertScript.setMaxSize(maxSizeIn.value * 1);
window.convertScript.setShrinkingFactor(shrinkingFactorIn.value * 1)