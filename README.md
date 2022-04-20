# mockm
<p align="center">
  <a href="https://github.com/wll8/mockm/blob/dev/README.zh.md">中文</a> |
  <a href="https://github.com/wll8/mockm/blob/dev/README.md">English</a>
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/dt/mockm" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/v/mockm" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/l/mockm" alt="License"></a>
<p>

- Watch the video
- [👉 View document](https://hongqiye.com/doc/mockm/)

A nodejs tool that elegantly solves various interface problems in the front-end development process.

## Features
mockm is implemented by pure node/js, which means:
  - Very friendly to the front end;
  - All ecological tools of nodejs can be used;
  - Don't worry about browser compatibility, h5/small programs/app can be used;

It is actually a back-end interface service, and the simulation is more comprehensive, for example:
  - Can see the network request in the browser console;
  - Able to simulate various interface functions of websocket/file upload/download;
  - Log recording, data replay;

Simplicity is the goal of this tool, for example:
  - You don't even need to install it, just run the command `npx mockm` to use it;
  - The modification takes effect immediately;
  - Comes with internal network penetration;
  
## quick start
``` sh
# Check the node version, currently mockm supports node v10.12.0 and above
node -v

# Install
npm i -g mockm

# Run it with the sample configuration
mockm --config 

# Browser open http://127.0.0.1:9005/#/apiStudio/
```

The above command will generate common configuration, modify `mm.config.js` and try it out.


👉 [Some examples](./server/example/simple.mm.config.js)

You can also [create an API through the UI interface](https://hongqiye.com/doc/mockm/use/webui.html#%E6%8E%A5%E5%8F%A3%E7%BC%96%E8%BE%91).

## Difference

| tool        | Brief introduction | Remark
| ----------- | ---- | ----
| mockjs      | The front end intercepts xhr requests and generates data  | Can't see the request in the web console
| json-server | Use json to generate Restful api  | No integrated data generation function
| yapi/rap2 | Manage interface documents, generate interfaces and data  | Trouble installation, inconvenient to synchronize with front-end projects


## Issues
You can check the documentation first, if you still can't solve it, please click [Issues](https://github.com/wll8/mockm/issues) and describe the steps and expectations of the problem in detail.

If you think this may be a mockm problem, it is recommended to attach the relevant error log in `httpData/log.err.txt` to the description.

## Thanks
The core functions of mockm are built by these tools, thanks to the hard work of every open source author.
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
- [json-server](https://github.com/typicode/json-server)
- [mockjs](https://github.com/nuysoft/Mock)

## Contribution
There are still many shortcomings in mockm. If you want, you are welcome to contribute.

## License
[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, xw

## Links

| project        | Introduction
| ----------- | ----
| [taroify](https://github.com/mallfoundry/taroify)      | Taroify is the Taro version of the mobile component library Vant. Both are based on the same visual specification and provide a consistent API interface to help developers quickly build small program applications.
