const webpack = require("webpack");
const fs = require("fs")
const path = require("path")

module.exports = () => {
    return new Promise((resolve, reject)=>{
        let webpackConfig = require("./webpack.renderer.config");

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
            console.log("Trinity electron renderer lib transpiled successfully.");

            let mainFileName = "trinity-renderer.js";
            let outputFilePath = path.join(stats.toJson().outputPath, mainFileName);
            let platformSrcDir = path.join(`${__dirname}`, "../../platform_src/electron/renderer");
            let electronOutputDir = path.join(outputFilePath, "../..");
            let trinityRootDir = path.join(outputFilePath, "../../../../..");
            let pluginSrcDir = path.join(trinityRootDir, "Runtime/plugin_src");
            let platformWwwOutputDir = path.join(electronOutputDir, "platform_www");

            // Copy the output file to electron www/ for convenience
            let wwwOutputFilePath = path.join(electronOutputDir, "www", mainFileName);
            console.log("Copying trinity-renderer.js from "+outputFilePath+" to "+wwwOutputFilePath);
            fs.copyFileSync(outputFilePath, wwwOutputFilePath);

            // TODO: MOVE THIS
            fs.copyFileSync(path.join(platformSrcDir, "dapp_preload.js"), path.join(platformWwwOutputDir, "dapp_preload.js"));

            // TODO: MOVE THIS - HAVENT FOUND A WAY TO AUTOMATICALLY COPY THOSE FILES WITH SOURCE-FILE IN PLUGIN.XML
            fs.copyFileSync(path.join(pluginSrcDir, "AppManager/src/electron/AppManagerPluginIsolated.js"), path.join(platformWwwOutputDir, "plugins/elastos-trinity-plugins-appmanager/src/electron/AppManagerPluginIsolated.js"));

            resolve();
        });
    });
};