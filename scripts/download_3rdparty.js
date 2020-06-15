"use strict";

// CONFIGURE HERE
const files_to_download  = [
  {
    "url": "https://github.com/elastos/Elastos.NET.Carrier.Swift.SDK/releases/download/release-v5.6.0/ElastosCarrier-framework.zip",
    "filename": "ElastosCarrier-framework.zip",
    "sourceDirs": [
      "ElastosCarrier-framework/ElastosCarrierSDK.framework"
    ],
    "targetDir": "../Plugins/Carrier/src/ios/libs",
    "md5": "32673236ca6507ac640c721c5003352c"
  },{
    "url": "https://github.com/elastos/Elastos.NET.Hive.Swift.SDK/releases/download/release-v1.0.1/ElastosHiveSDK-framework-for-trinity.zip",
    "filename": "ElastosHiveSDK-framework-for-trinity.zip",
    "sourceDirs": [
      "ElastosHiveSDK-framework-for-trinity/Alamofire.framework",
      "ElastosHiveSDK-framework-for-trinity/ElastosHiveSDK.framework",
      "ElastosHiveSDK-framework-for-trinity/PromiseKit.framework",
      "ElastosHiveSDK-framework-for-trinity/Swifter.framework"
    ],
    "targetDir": "../Plugins/Hive/src/ios/libs",
    "md5": "c7740161c0541f1e23a994419b57c81f"
  },{
    "url": "https://github.com/elastos/Elastos.Trinity.Plugins.Wallet/releases/download/spvsdk-V0.5.0/libspvsdk.zip",
    "filename": "libspvsdk.zip",
    "sourceDirs": [
      "libspvsdk"
    ],
    "targetDir": "../Plugins/Wallet/src/ios",
    "md5": "e5f32bd9be63883284ce67d5d756ae6e"
  },{
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/ElastosDIDSDK.framework.zip",
    "filename": "ElastosDIDSDK.framework.zip",
    "sourceDirs": [
      "ElastosDIDSDK.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "ee919ad885165610d2b0fa2091bf92af"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/Antlr4.framework.zip",
    "filename": "Antlr4.framework.zip",
    "sourceDirs": [
      "Antlr4.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "3adaf2344ba460b1b46c449d8598f0cb"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/PromiseKit.framework.zip",
    "filename": "PromiseKit.framework.zip",
    "sourceDirs": [
      "PromiseKit.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "6f7096e86b45f79bef2a935e57f4de90"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/Cryptor.framework.zip",
    "filename": "Cryptor.framework.zip",
    "sourceDirs": [
      "Cryptor.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "35b7599f8da68f2e72903bd18ce0d0cd"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/CryptorRSA.framework.zip",
    "filename": "CryptorRSA.framework.zip",
    "sourceDirs": [
      "CryptorRSA.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "dc4bbadc5ba1063621e9280108bd1475"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/KituraContracts.framework.zip",
    "filename": "KituraContracts.framework.zip",
    "sourceDirs": [
      "KituraContracts.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "b75d65b9f5cda85d5a46c5852eb50186"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/LoggerAPI.framework.zip",
    "filename": "LoggerAPI.framework.zip",
    "sourceDirs": [
      "LoggerAPI.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "7f00086233dcc7e919aa9e25335e0d47"
  },
  {
    "url": "https://github.com/elastos/Elastos.DID.Swift.SDK/releases/download/v0.1.0/Logging.framework.zip",
    "filename": "Logging.framework.zip",
    "sourceDirs": [
      "Logging.framework"
    ],
    "targetDir": "../Plugins/DID/src/ios/libs",
    "md5": "aa4649f771f03e63eb71b15ad458851e"
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

          fileMatched = fs.existsSync(zipFilePath)
                        && fs.lstatSync(zipFilePath).isFile()
                        && await md5File(zipFilePath) == obj.md5
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
