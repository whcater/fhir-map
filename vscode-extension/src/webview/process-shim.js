// 提供一个基本的process对象作为浏览器环境中的polyfill
globalThis.process = globalThis.process || {
  env: {
    NODE_ENV: 'production'
  }
}; 