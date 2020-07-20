const webpack = require("webpack");
const fs = require("fs")
const path = require("path");
const { exec } = require("child_process");

console.log("START - build.main.js");

function finalize() {
    console.log("Finalizing");

    let mainFileName = "main.js";
    let outputFileDir = `${__dirname}/../../platforms/electron/platform_www/`
    let outputFilePath = path.join(outputFileDir, mainFileName);
    let platformSrcDir = path.join(`${__dirname}`, "../../platform_src/electron/main");
    let electronOutputDir = path.join(outputFilePath, "../..");
    let platformWwwOutputDir = path.join(electronOutputDir, "platform_www");
    let wwwOutputDir = path.join(electronOutputDir, "www");
    let trinityRootDir = path.join(outputFilePath, "../../../../..");
    let pluginSrcDir = path.join(trinityRootDir, "Runtime/plugin_src");

    // Copy the output file to electron www/ for convenience
    /*let wwwOutputFilePath = path.join(electronOutputDir, "www", mainFileName);
    console.log("Copying cdv-electron-main.js from "+outputFilePath+" to "+wwwOutputFilePath);
    fs.copyFileSync(outputFilePath, wwwOutputFilePath);*/

    // Get vscode config ready to be able to start the trinity electorn project for debug (main process logs/debug)
    // TODO: MOVE THIS VSCODE CONFIG COPY NOT IN THIS TRANSPILE SCRIPT BUT WHEN BUILDING THE PLATFORM ONLY
    let vsCodeDir = path.join(trinityRootDir, ".vscode");
    if (!fs.existsSync(vsCodeDir))
        fs.mkdirSync(vsCodeDir);
    fs.copyFileSync(`${__dirname}/vscodeconfig/launch.json`, path.join(vsCodeDir, "launch.json"));
    fs.copyFileSync(`${__dirname}/vscodeconfig/tasks.json`, path.join(vsCodeDir, "tasks.json"));

    // TODO: MOVE THIS
    fs.copyFileSync(path.join(platformSrcDir, "index.html"), path.join(platformWwwOutputDir, "index.html"));
	
	fs.copyFileSync(path.join(platformSrcDir, "cdv-electron-settings.json"), path.join(platformWwwOutputDir, "cdv-electron-settings.json"));
	

    console.log("Copies completed.")
}

module.exports = () => {
    return new Promise((resolve, reject)=>{
        let tsConfig = path.join(`${__dirname}`, "../../platform_src/electron/main/tsconfig.json");
        let transpileCommand = 'tsc --build '+tsConfig+" --force";
        console.log("Executing shell command: "+transpileCommand);
        exec(transpileCommand, (err, stdout, stderr) => {
            if (err) {
                console.error(err)
            }
            else {
                console.log("Transpile success.")
            }

            finalize();
            resolve();
        });

        //return;
        
        //let webpackConfig = require("./webpack.main.config");

        // Do some cleanup
        let defaultElectronMainPath = `${__dirname}/../../platforms/electron/platform_www/cdv-electron-main.js`;
        if (fs.existsSync(defaultElectronMainPath))
            fs.unlinkSync(defaultElectronMainPath);
    
		return;
		
        webpack(webpackConfig, (err, stats) => {
            if (err || stats.hasErrors()) {
                if (err)
                    console.error(err);
    
                if (stats.hasErrors()) {
                    console.error(stats.toString());
                }

                reject("Webpack error");
            }
    
            // Success
            console.log("Trinity electron runtime transpiled successfully.");
                        
            resolve();
        });
    });
};