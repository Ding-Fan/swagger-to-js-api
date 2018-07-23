// https://stackoverflow.com/a/43622386
import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as path from 'path';

const inputFilePath = process.argv[2];
const apiFilter = process.argv[3];

console.log(process.argv);

if (!inputFilePath) {
  throw new Error('没找到 json 文件！');
}

if (!apiFilter) {
  throw new Error('请问需要来点 cms 还是 mini ？');
}

const outputDir = path.dirname(inputFilePath);

let apiNameParser = (name : String) => {
  return name
    .charAt(1)
    .toUpperCase();
}

async function main() {
  try {
    const inputFile = await fsPromises.readFile(inputFilePath);
    const inputFileJson = JSON.parse(inputFile.toString());

    const baseUrl = `https://${inputFileJson.host}${inputFileJson.basePath}`;

    let outputFile = `
    const baseUrl = '${baseUrl}';
    `
    switch (apiFilter) {
      case 'cms':
        outputFile += `
        import HttpRequest from "../jslib/dk-axios";

        `
        break;
      case 'mini':
        outputFile += `
        import wepy from "wepy";

        `
        break;

      default:
        break;
    }

    // let miniModules = inputFileJson   .tags   .filter((item : {     name: String,
    //     description: String   }) => {     return item       .name .split('-')[0]
    // === 'mini'   }); console.log(miniModules);

    let swapArray = [];

    let parsedPaths = [];
    Object
      .keys(inputFileJson.paths)
      .forEach(element => {
        if (element.split('/')[1] !== apiFilter) {
          return;
        }
        let apiUrl = element;
        let method = Object.keys(inputFileJson.paths[element])[0];
        let apiName = `${method}${element.replace(/(\/[a-z]|_[a-z])/g, apiNameParser)}`;
        let apiData = '';
        let innerObject = inputFileJson.paths[element][Object.keys(inputFileJson.paths[element])[0]];
        let summary = innerObject.summary;

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
        // let anApi = ` export const ${apiName} = data => {   return wepy.request({
        // url: baseUrl + '${apiUrl}',     method: '${method}',     data   }) } `
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
        } else if (apiFilter === 'mini') {} else {}
        outputFile += anApi;
      });

    await fsPromises.writeFile('api.js', `${outputFile}`);
    // let miniPaths = inputFileJson   .paths   .filter((item : any) => {     return
    // miniModules.some((module : {       name: String,       description: String
    // }) => {       return module.name === item.     })   })
  } catch (error) {}
}

main();
