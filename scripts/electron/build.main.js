const webpack = require("webpack");
const fs = require("fs")
const path = require("path")

module.exports = () => {
    return new Promise((resolve, reject)=>{
        let webpackConfig = require("./webpack.main.config");

        // Do some cleanup
        let defaultElectronMainPath = `${__dirname}/../../platforms/electron/platform_www/cdv-electron-main.js`;
        if (fs.existsSync(defaultElectronMainPath))
            fs.unlinkSync(defaultElectronMainPath);
    
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

            let mainFileName = "cdv-electron-main.js";
            let outputFilePath = path.join(stats.toJson().outputPath, mainFileName);
            let platformSrcDir = path.join(`${__dirname}`, "../../platform_src/electron/main");
            let electronOutputDir = path.join(outputFilePath, "../..");
            let platformWwwOutputDir = path.join(electronOutputDir, "platform_www");
            let trinityRootDir = path.join(outputFilePath, "../../../../..");

            // Copy the output file to electron www/ for convenience
            let wwwOutputFilePath = path.join(electronOutputDir, "www", mainFileName);
            console.log("Copying cdv-electron-main.js from "+outputFilePath+" to "+wwwOutputFilePath);
            fs.copyFileSync(outputFilePath, wwwOutputFilePath);

            // Get vscode config ready to be able to start the trinity electorn project for debug (main process logs/debug)
            // TODO: MOVE THIS VSCODE CONFIG COPY NOT IN THIS TRANSPILE SCRIPT BUT WHEN BUILDING THE PLATFORM ONLY
            let vsCodeDir = path.join(trinityRootDir, ".vscode");
            if (!fs.existsSync(vsCodeDir))
                fs.mkdirSync(vsCodeDir);
            fs.copyFileSync(`${__dirname}/vscodeconfig/launch.json`, path.join(vsCodeDir, "launch.json"));
            fs.copyFileSync(`${__dirname}/vscodeconfig/tasks.json`, path.join(vsCodeDir, "tasks.json"));

            // TODO: MOVE THIS
            fs.copyFileSync(path.join(platformSrcDir, "index.html"), path.join(platformWwwOutputDir, "index.html"));

            resolve();
        });
    });
};