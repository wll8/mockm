;(() => {
  var oldonload = window.onload;
  if (typeof window.onload !== 'function') {
    window.onload = main
  } else {
    window.onload = function () {
      oldonload();
      main()
    }
  }
  
  function main() {
    loadJs(`https://cdn.jsdelivr.net/npm/mockjs@1.1.0/dist/mock-min.js`, () => {
      //使用mockjs模拟数据
      Mock.mock(`/test`, `@cname`);
      Mock.mock(`/test/:id`, `@id`);
      console.log(`加载完成`, Mock.mock)
    })
  }

  function loadJs(url, callback) {
    var script = document.createElement("script")
    script.type = "text/javascript";
    if (script.readyState) { //IE
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" ||
          script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else { //Others: Firefox, Safari, Chrome, and Opera
      script.onload = function () {
        callback();
      };
    }
    script.src = url;
    document.body.appendChild(script);
  }
})();