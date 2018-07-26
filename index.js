// https://stackoverflow.com/a/43622386
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
// import {promises as fsPromises} from 'fs'; const inputFilePath =
// process.argv[2]; const apiFilter = process.argv[3];

const inputFilePath = 'demo.json';
const apiFilter = 'cms';

console.log(process.argv);

if (!fs.existsSync(inputFilePath)) {
  throw new Error('没找到 json 文件！');
}

if (!apiFilter) {
  throw new Error('cms 还是 mini ？');
}

const outputDir = path.dirname(inputFilePath);

let apiNameParser = name => {
  return name
    .charAt(1)
    .toUpperCase();
}

let main = async() => {

  const inputFile = await fsPromises.readFile(inputFilePath);
  const inputFileJson = JSON.parse(inputFile.toString());

  const baseUrl = `https://${inputFileJson.host}${inputFileJson.basePath}`;

  let outputFile = `
    // const baseUrl = '${baseUrl}';
    `

  // let miniModules = inputFileJson   .tags   .filter((item : {     name: String,
  //     description: String   }) => {     return item       .name .split('-')[0]
  // === 'mini'   }); console.log(miniModules);

  let separateFiles = {};

  let parsedPaths = [];
  Object
    .keys(inputFileJson.paths)
    .forEach(element => {
      if (element.split('/')[1] !== apiFilter) {
        return;
      }

      let apiUrl = element.replace(/\/\{[a-zA-Z]+\}\//, '');
      let method = Object.keys(inputFileJson.paths[element])[0];
      let apiName = `${method}${apiUrl.replace(/(\/[a-z]|_[a-z])/g, apiNameParser)}`;
      let apiData = '';
      let innerObject = inputFileJson.paths[element][Object.keys(inputFileJson.paths[element])[0]];
      let summary = innerObject.summary;
      if (apiFilter === 'cms') {
        switch (method) {
          case "get":
            apiData = `params: data`;
            break;
          case "post":
            apiData = `data`;

            break;
          case "delete":

            break;
          case "put":

            break;

          default:
            break;
        }

      } else if (apiFilter === 'mini') {
        switch (method) {
          case "get":
            apiData = `data`;
            break;
          case "post":
            apiData = `data`;

            break;
          case "delete":

            break;
          case "put":

            break;

          default:
            break;
        }
      }

      let anApi = ''
      if (apiFilter === 'cms') {

        anApi = `
            // ${summary}
            export const ${apiName} = data => {
              return HttpRequest({
                url: baseUrl + '${apiUrl}',
                method: '${method}',
                ${apiData}
              });
            };

          `
      } else if (apiFilter === 'mini') {
        anApi = `
          // ${summary}
          export const ${apiName} = data => {
            return wepy.request({
              url: baseUrl + '${apiUrl}',
              method: '${method}',
              ${apiData}
            })
          }
          `
      } else {}

      if (separateFiles[innerObject.tags[0]]) {
        separateFiles[innerObject.tags[0]] += anApi;
      } else {
        switch (apiFilter) {
          case 'cms':
            separateFiles[innerObject.tags[0]] = `
              import HttpRequest from "../jslib/dk-axios";
      
              `
            break;
          case 'mini':
            separateFiles[innerObject.tags[0]] = `
              import wepy from "wepy";
              import {baseUrl} from '@/environment/url';
      
              `
            break;

          default:
            break;
        }
      }
      // outputFile += anApi;
    });
  Object
    .keys(separateFiles)
    .forEach(async item => {
      await fsPromises.writeFile(`${item}.js`, `${outputFile + separateFiles[item]}`);
    });
  // let miniPaths = inputFileJson   .paths   .filter((item : any) => {     return
  // miniModules.some((module : {       name: String,       description: String
  // }) => {       return module.name === item.     })   })

}

main();
