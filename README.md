# Swagger to API

目前只有简单的用法。帮助你节约复制粘贴以及起名的时间。可能有一些 bug 需要手动调整。

我当前的 node 版本为 10.5.2 ，没试过在其它版本下运行。

Tips: node 版本管理工具 [**nvm**](https://github.com/creationix/nvm) ， 用过都说好，谁用谁知道。（ windows 用户无法使用，请寻找其它类似工具）

### Usage 用法

- 首先把本项目 clone 下来或者下载下来
- 然后执行 `npm i` 或 `yarn` 安装依赖
- 执行下面的命令，其中
  - 打开后端提供的 swagger 地址，打开开发者工具，找到 `api-docs` ，这就是你的 `demo.json` 的来源
  - 最后一个参数可为 `cms` 或 `mini`。日后会针对后台、小程序等项目类别进行优化。

```bash
npx ts-node index.ts demo.json cms
```

然后会生成一个 `api.js` 文件。请随意使用！

Tips: 当更新 `api.js` 时，可以使用 diff 工具，如果你用 vscode ，可以直接 compare file 。

---

**Inspired by [json2api](https://git.dankal.cn/Yjhenan/json2api)**

**Thanks to @Zhao**
