const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const pngToIco = require('png-to-ico'); 


// 主函数
async function main() {
  
    // 使用png-to-ico将PNG转换为ICO
    const icoBuffer = await pngToIco([
      './temp/favicon.png',
    ]);    
  fs.writeFileSync('./temp/favicon.ico', icoBuffer);

}

main().catch(error => {
  console.error('执行过程中出错:', error);
  process.exit(1);
}); 