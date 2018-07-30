// https://stackoverflow.com/a/43622386
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
// import {promises as fsPromises} from 'fs';

const inputFilePath = process.argv[2];

if (!process.argv[3]) {
  throw new Error('请提供一个或多个过滤名称，例如 mini ，cms merchant');
}

const apiFilterOne = process
  .argv[3]
  .toLowerCase();

let apiFilterTwo = '';
if (process.argv[4]) {
  apiFilterTwo = process
    .argv[4]
    .toLowerCase();
}

// const inputFilePath = 'demo.json';
console.log(inputFilePath);
// const apiFilterOne = 'cms';
console.log('apiFilterOne: ', apiFilterOne);
// const apiFilterTwo = '';
console.log('apiFilterTwo: ', apiFilterTwo);

console.log(process.argv);

if (!fs.existsSync(inputFilePath)) {
  throw new Error('没找到 json 文件！');
}

const outputDir = path.dirname(inputFilePath);

let apiNameParser = name => {
  return name
    .charAt(1)
    .toUpperCase();
}

let apiUrlParser = url => {
  return `\${data.${url.replace(/{|}/g, '')}}`
}

let main = async() => {

  const inputFile = await fsPromises.readFile(inputFilePath);
  const inputFileJson = JSON.parse(inputFile.toString());

  const baseUrl = `https://${inputFileJson.host}${inputFileJson.basePath}`;

  let outputFile = `
    // const baseUrl = '${baseUrl}';
    `

  let separateFiles = {};

  let parsedPaths = [];
  Object
    .keys(inputFileJson.paths)
    .forEach(element => {
      if (element.split('/')[1] !== apiFilterOne) {
        return;
      } else if (apiFilterTwo && element.split('/')[2] !== apiFilterTwo) {
        return;
      }

      let apiUrl = element.replace(/\{[a-zA-Z]+\}/g, apiUrlParser);
      // Cut out the path parameters
      let apiRowName = element.replace(/\/?\{[a-zA-Z]+\}\/?/g, '');
      let method = Object.keys(inputFileJson.paths[element])[0];
      let apiName = `${method}${apiRowName.replace(/(\/[a-z]|_[a-z])/g, apiNameParser)}`;
      if (!apiFilterTwo) {
        apiName = apiName.replace((apiFilterOne.charAt(0).toUpperCase() + apiFilterOne.substr(1)), '');
      } else {
        apiName = apiName.replace((apiFilterOne.charAt(0).toUpperCase() + apiFilterOne.substr(1) + apiFilterTwo.charAt(0).toUpperCase() + apiFilterTwo.substr(1)), '');
      }
      let apiData = '';
      let anApi = ''
      let innerObject = inputFileJson.paths[element][Object.keys(inputFileJson.paths[element])[0]];
      let summary = innerObject.summary;
      if (apiFilterOne === 'cms') {

        switch (method) {
          case "get":
            if (!apiUrl.includes('$')) {
              apiData = `params: data`;
            }
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

        anApi = `
        // ${summary}
        export const ${apiName} = data => {
          return HttpRequest({
            url: \`${apiUrl}\`,
            method: '${method}',
            ${apiData}
          });
        };

      `

      } else if (apiFilterOne === 'mini') {
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

        anApi = `
        // ${summary}
        export const ${apiName} = data => {
          return wepy.request({
            url: \`${baseUrl}${apiUrl}\`,
            method: '${method}',
            ${apiData}
          })
        }
        `
      }

      if (separateFiles[innerObject.tags[0]]) {
        separateFiles[innerObject.tags[0]] += anApi;
      } else {
        switch (apiFilterOne) {
          case 'cms':
            separateFiles[innerObject.tags[0]] = `
              import HttpRequest from "../jslib/dk-axios";
      
              ${anApi}
              `
            break;
          case 'mini':
            separateFiles[innerObject.tags[0]] = `
              import wepy from "wepy";
              import {baseUrl} from '@/environment/url';
      
              ${anApi}
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
      let fileName = item;
      if (!apiFilterTwo) {
        fileName = fileName.replace(`${apiFilterOne}-`, '');
      } else {
        fileName = fileName.replace(`${apiFilterOne}-${apiFilterTwo}-`, '');
      }
      if (!fs.existsSync('service/')) {
        fs.mkdirSync('service/');
      }
      await fsPromises.writeFile(`service/${fileName}.js`, `${outputFile + separateFiles[item]}`);
    });
}

main();
