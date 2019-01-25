// https://stackoverflow.com/a/43622386
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
// import {promises as fsPromises} from 'fs';

const inputFilePath = process.argv[2];

if (!process.argv[3]) {
  throw new Error('请提供一个或多个过滤名称，例如 mini ，cms merchant');
}

// const apiFilterOne = process   .argv[3]   .toLowerCase(); let apiFilterTwo =
// ''; if (process.argv[4]) {   apiFilterTwo = process     .argv[4]
// .toLowerCase(); }

const apiFilter = process.argv[3];

let apiType;
if (process.argv[4]) {
  apiType = process
    .argv[4]
    .toLowerCase();
}

// const inputFilePath = 'demo.json';
console.log(inputFilePath);
// const apiFilterOne = 'cms'; console.log('apiFilterOne: ', apiFilterOne);
// const apiFilterTwo = ''; console.log('apiFilterTwo: ', apiFilterTwo);

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
  Object.keys(inputFileJson.paths) // Get the **paths**
    .forEach(element => {
    console.log(element)

    // if (element.split('/')[1] !== apiFilterOne) {   return; } else if
    // (apiFilterTwo && element.split('/')[2] !== apiFilterTwo) {   return; }
    let apiFilterRegExp = new RegExp(`^${apiFilter}`)
    if (!apiFilterRegExp.test(element)) {
      return;
    }

    let apiUrl = element
      .replace(apiFilterRegExp, '')
      .replace(/\{[a-zA-Z]+\}/g, apiUrlParser);
    // Cut out the path parameters
    let apiRowName = element.replace(/\/?\{[a-zA-Z]+\}\/?/g, '');
    let methods = Object.keys(inputFileJson.paths[element]);
    methods.forEach(method => {
      let apiData = '';
      let anApi = ''
      let networkComment = '';
      let apiName = `${method}${apiRowName.replace(/(\/[a-z]|_[a-z])/g, apiNameParser)}`;
      if (apiUrl.includes('$')) {
        apiName = `${apiName}Uuid`
      }
      // if (!apiFilterTwo) {   apiName =
      // apiName.replace((apiFilterOne.charAt(0).toUpperCase() +
      // apiFilterOne.substr(1)), ''); } else { apiName =
      // apiName.replace((apiFilterOne.charAt(0).toUpperCase() +
      // apiFilterOne.substr(1) + apiFilterTwo.charAt(0).toUpperCase() +
      // apiFilterTwo.substr(1)), ''); }

      let innerObject = inputFileJson.paths[element][method];
      let summary = innerObject.summary;

      innerObject
        .parameters
        .splice(innerObject.parameters.findIndex(i => i["in"] === 'header'), 1);

      innerObject
        .parameters
        .forEach(item => {

          switch (item["in"]) {
            case 'query':

              networkComment += `${item.name}:`;
              switch (item.type) {
                case 'integer':
                  networkComment += ` 0,`

                  break;
                case 'boolean':
                  networkComment += ` true,`

                  break;
                case 'string':
                  networkComment += ` '',`

                  break;

                default:
                  break;
              }
              networkComment += '\n';
              break;
            case 'body':
              let bodyDefinitions = inputFileJson.definitions[
                item
                  .schema['$ref']
                  .replace('#/definitions/', '')
              ];
              console.log(item);
              console.log(bodyDefinitions);

              if (bodyDefinitions.type === 'object') {
                bodyDefinitions
                  .required
                  .forEach(item => {
                    switch (bodyDefinitions.properties[item].type) {
                      case 'string':
                        console.log(bodyDefinitions.properties[item]);
                        networkComment += `${item}:`;
                        switch (bodyDefinitions.properties[item].type) {
                          case 'integer':
                            networkComment += ` 0,`

                            break;
                          case 'boolean':
                            networkComment += ` true,`

                            break;
                          case 'string':
                            networkComment += ` '',`

                            break;

                          default:
                            break;
                        }
                        networkComment += '\n';

                        break;

                      default:
                        break;
                    }

                  })
              }

              break;

            default:
              break;
          }

        });

      if (networkComment) {
        networkComment = `{
          ${networkComment}
        }`
      }

      networkComment = `
/*------
network() {
  return {
    ${apiName}: async () => {
      let {data, statusCode} = await ${apiName}(${networkComment});

      if (statusCode == 200) {

      } else {
        wepy.showToast({
          title: data.error.message, //提示的内容,
          icon: 'none', //图标,
          duration: 2000, //延迟时间,
          mask: true, //显示透明蒙层，防止触摸穿透,
          success: res => {}
        });
      }

      this.$apply();
    },

  }
}
------*/
`

      if (apiType === 'cms') {

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
        ${networkComment}

        export const ${apiName} = data => {
          return HttpRequest({
            url: \`${apiUrl}\`,
            method: '${method}',
            ${apiData}
          });
        };

      `

      } else if (apiType === 'mini') {
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
        ${networkComment}

        export const ${apiName} = data => {
          return wepy.request({
            url: \`${apiUrl}\`,
            method: '${method}',
            ${apiData}
          })
        }
        `
      }

      if (separateFiles[innerObject.tags[0]]) {
        separateFiles[innerObject.tags[0]] += anApi;
      } else {
        switch (apiType) {
          case 'cms':
            separateFiles[innerObject.tags[0]] = `
              import HttpRequest from "../jslib/dk-axios";
      
              ${anApi}
              `
            break;
          case 'mini':
            separateFiles[innerObject.tags[0]] = `
              import wepy from "wepy";
      
              ${anApi}
              `
            break;

          default:
            break;
        }
      }
    });
    // outputFile += anApi;
  });
  Object
    .keys(separateFiles)
    .forEach(async item => {
      let fileName = item;
      if (!apiType) {
        // fileName = fileName.replace(`${apiType}-`, ''); } else {   fileName =
        // fileName.replace(`${apiType}-${apiFilterTwo}-`, '');
      }
      if (!fs.existsSync('service/')) {
        fs.mkdirSync('service/');
      }
      await fsPromises.writeFile(`service/${fileName}.js`, `${outputFile + separateFiles[item]}`);
    });
}

main();
