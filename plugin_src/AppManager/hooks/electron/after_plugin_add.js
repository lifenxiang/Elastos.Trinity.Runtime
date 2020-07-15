const fs = require("fs");

module.exports = function(context) {
    let mainProcessFileName = "AppManagerPluginMain.ts"
    let mainProcessFileSrcPath = `${__dirname}/../../src/electron/` + mainProcessFileName
    let mainProcessFileDestFolder = context.opts.projectRoot+"/platform_src/electron/main/plugins_main/"
    let mainProcessFileDestPath = mainProcessFileDestFolder + "/" + mainProcessFileName

    // Ensure the folder exists
    /*fs.mkdirSync(mainProcessFileDestFolder, {
        recursive: true
    })

    fs.copyFileSync(mainProcessFileSrcPath, mainProcessFileDestPath)*/
}