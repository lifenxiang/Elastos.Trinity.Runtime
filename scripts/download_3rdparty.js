"use strict";

// CONFIGURE HERE
const files_to_download  = [
  {
    "url": "https://github.com/elastos/Elastos.NET.Carrier.Swift.SDK/releases/download/release-v5.6.5/ElastosCarrier-framework.zip",
    "filename": "ElastosCarrier-framework.zip",
    "sourceDirs": [
      "ElastosCarrier-framework/ElastosCarrierSDK.framework"
    ],
    "targetDir": "../Plugins/Carrier/src/ios/libs",
    "md5": "b75bb05b7b393147019a19e7c67c33ad"
  },{
    "url": "https://github.com/elastos/Elastos.NET.Hive.Swift.SDK/releases/download/release-v1.0.2/ElastosHiveSDK-framework-for-trinity.zip",
    "filename": "ElastosHiveSDK-framework-for-trinity.zip",
    "sourceDirs": [
      "ElastosHiveSDK-framework-for-trinity/Alamofire.framework",
      "ElastosHiveSDK-framework-for-trinity/ElastosHiveSDK.framework",
      "ElastosHiveSDK-framework-for-trinity/PromiseKit.framework",
      "ElastosHiveSDK-framework-for-trinity/Swifter.framework"
    ],
    "targetDir": "../Plugins/Hive/src/ios/libs",
    "md5": "d880459853b2e65940de1bee1638d8d0"
  },{
    "url": "https://github.com/elastos/Elastos.Trinity.Plugins.Wallet/releases/download/spvsdk-V0.5.7.0/libspvsdk.zip",
    "filename": "libspvsdk.zip",
    "sourceDirs": [
      "libspvsdk"
    ],
    "targetDir": "../Plugins/Wallet/src/ios",
    "md5": "157c6056294349d69a8ee4a50a5c9666"
  },{
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/release-v1.1/ElastosDIDSDK-framework-for-trinity.zip",
    "filename": "ElastosDIDSDK-framework-for-trinity.zip",
    "sourceDirs": [
      "ElastosDIDSDK-framework-for-trinity/ElastosDIDSDK.framework",
      "ElastosDIDSDK-framework-for-trinity/Antlr4.framework",
      "ElastosDIDSDK-framework-for-trinity/PromiseKit.framework",
      "ElastosDIDSDK-framework-for-trinity/Cryptor.framework",
      "ElastosDIDSDK-framework-for-trinity/CryptorRSA.framework",
      "ElastosDIDSDK-framework-for-trinity/KituraContracts.framework",
      "ElastosDIDSDK-framework-for-trinity/LoggerAPI.framework",
      "ElastosDIDSDK-framework-for-trinity/Logging.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "9704bc4a272c34102a092a5e3f45c2d2"
  }
]
// no need to configure below

const fs = require('fs'),
      path = require('path');

function DeleteDirectory(dir) {
  if (fs.existsSync(dir) == true) {
    var files = fs.readdirSync(dir);
    files.forEach(function(item){
      var item_path = path.join(dir, item);
      if (fs.statSync(item_path).isDirectory()) {
        DeleteDirectory(item_path);
      }
      else {
        fs.unlinkSync(item_path);
      }
    });
    fs.rmdirSync(dir);
  }
}

module.exports = function(ctx) {
  // console.log("download_3rdparty ", JSON.stringify(ctx, null, 2));

  // make sure ios platform is part of platform add
  if (!ctx.opts.platforms.some((val) => val.startsWith("ios"))) {
    return;
  }

  const wget = require('node-wget-promise'),
        readline = require('readline'),
        md5File = require('md5-file/promise'),
        yauzl = require("yauzl"),
        mkdirp = require("mkdirp");

  let cachePath = path.join(path.dirname(ctx.scriptLocation), 'cache');
  mkdirp.sync(cachePath);

  let promise = new Promise(function(resolve, reject) {
    (async () => {
      let zip_file_count = 0;
      let downloaded_all_files = false;
      for (const obj of files_to_download) {
        let zipFilePath = path.join(cachePath, obj.filename)

        //
        // Check the md5 of the downloaded file
        //
        let fileMatched = fs.existsSync(zipFilePath)
                          && fs.lstatSync(zipFilePath).isFile()
                          && await md5File(zipFilePath) == obj.md5

        const max_attempt = 3;
        let attempt = 0;
        let files_need_to_update = false;
        while (!fileMatched && attempt < max_attempt) {
          attempt++;

          console.log("Start to download file " + obj.filename);
          let unit = "bytes"
          await wget(obj.url, {
            onProgress: (status) => {
              let downloadedSizeInUnit = status.downloadedSize
              switch (unit) {
                case "bytes":
                  if (status.downloadedSize > (1 << 10)) {
                      downloadedSizeInUnit /= (1 << 10)
                      unit = "KB"
                  }
                  break;
                case "KB":
                  downloadedSizeInUnit /= (1 << 10)
                  if (status.downloadedSize > (1 << 20)) {
                      downloadedSizeInUnit /= (1 << 10)
                      unit = "MB"
                  }
                  break;
                case "MB":
                  downloadedSizeInUnit /= (1 << 20)
                  if (status.downloadedSize > (1 << 30)) {
                      downloadedSizeInUnit /= (1 << 10)
                      unit = "GB"
                  }
                  break;
                default:
                  downloadedSizeInUnit /= (1 << 30)
                  break;
              }
              readline.clearLine(process.stdout, 0);
              process.stdout.write("Downloading " + downloadedSizeInUnit.toFixed(1)
                                  + " " + unit);
              if (status.percentage) {
                process.stdout.write(" (" + (status.percentage * 100).toFixed(1) + "%)\r");
              }
              else {
                process.stdout.write("\r");
              }
            },
            output: zipFilePath
          });
          readline.clearLine(process.stdout, 0);
          console.log("Download finished.");

          if (fs.existsSync(zipFilePath) && fs.lstatSync(zipFilePath).isFile()) {
            let downloadFilemd5 = await md5File(zipFilePath)
            fileMatched = downloadFilemd5 == obj.md5;
            if (!fileMatched) {
              console.log("the md5 is " + downloadFilemd5 + " , the expected md5 is " + obj.md5);
            }
          }
          else {
            fileMatched = false;
          }

          files_need_to_update = true;
        }

        if (!fileMatched) {
          reject('Failed to download ' + obj.filename);
        }

        // Zip file matched md5
        console.log("File %s is ready!", obj.filename);
        if (fs.existsSync(ctx.opts.projectRoot) && fs.lstatSync(ctx.opts.projectRoot).isDirectory()) {
          let targetPath = path.join(ctx.opts.projectRoot, obj.targetDir);
          mkdirp.sync(targetPath);
          if (files_need_to_update) {// delete the old files
            for (const srcDir of obj.sourceDirs) {
              let baseName = path.basename(srcDir);
              let frameworkDir = path.join(targetPath, baseName);
              console.log("    DeleteDirectory:", frameworkDir);
              DeleteDirectory(frameworkDir);
            }
          }
          if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory()) {
            console.log("Unziping file %s", obj.filename);
            yauzl.open(zipFilePath, {lazyEntries: true}, function(err, zipfile) {
              if (err) reject(err);
              zip_file_count++;
              zipfile.readEntry();
              zipfile.on("entry", async (entry) => {
                if (/\/$/.test(entry.fileName)) {
                  // Directory file names end with '/'.
                  // Note that entires for directories themselves are optional.
                  // An entry's fileName implicitly requires its parent directories to exist.
                  zipfile.readEntry();
                } else {
                  // file entry
                  let openedReadStream = false;
                  for (const srcDir of obj.sourceDirs) {
                    let relativePath = path.relative(srcDir, entry.fileName);
                    if (!relativePath.startsWith("..")) {
                      let baseName = path.basename(srcDir);
                      relativePath = path.join(baseName, relativePath);
                      let relativeDir = path.dirname(relativePath);
                      let outputDir = path.join(targetPath, relativeDir);
                      let outputPath = path.join(targetPath, relativePath);
                      mkdirp.sync(outputDir);
                      openedReadStream = true;
                      await zipfile.openReadStream(entry, function(err, readStream) {
                        if (err) reject(err);
                        readStream.on("end", function() {
                          zipfile.readEntry();
                        });
                        let writeStream = fs.createWriteStream(outputPath);
                        readStream.pipe(writeStream);
                      });
                    }
                  }

                  if (!openedReadStream) {
                    zipfile.readEntry();
                  }
                }
              });
              zipfile.on("end", () => {
                zip_file_count--;
                if (zip_file_count == 0 && downloaded_all_files) {
                  console.log("Finish download and unzip 3rdparties.");
                  resolve();
                }
              });
            });
          }
          else {
            reject("targetDir not exist");
          }
        }
      }
      downloaded_all_files = true;
      if (zip_file_count == 0) {
        resolve();
      }
    })();
  });

  return promise;
};
