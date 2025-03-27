const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('开始生成图像文件...');

// 要创建的目录
const directories = [
  './public/images',
  './resources/images',
  './src/assets/images',
  './vscode-extension/resources/images'
];

// 确保目录存在
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
});

// 安装所需的npm包
async function installPackages() {
  console.log('检查并安装必要的npm包...');
  
  try {
    // 检查package.json是否存在
    if (!fs.existsSync('./package.json')) {
      throw new Error('找不到package.json文件');
    }
    
    // 读取package.json
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // 检查是否已经安装了sharp
    const hasSharp = packageJson.dependencies && packageJson.dependencies.sharp;
    const hasSharpDev = packageJson.devDependencies && packageJson.devDependencies.sharp;
    
    // 安装sharp（如果尚未安装）
    if (!hasSharp && !hasSharpDev) {
      console.log('安装sharp包...');
      await execPromise('npm install --save-dev sharp');
      console.log('sharp安装完成');
    }
    
    // 检查是否已经安装了png-to-ico
    const hasPngToIco = packageJson.dependencies && packageJson.dependencies['png-to-ico'];
    const hasPngToIcoDev = packageJson.devDependencies && packageJson.devDependencies['png-to-ico'];
    
    // 安装png-to-ico（如果尚未安装）
    if (!hasPngToIco && !hasPngToIcoDev) {
      console.log('安装png-to-ico包...');
      await execPromise('npm install --save-dev png-to-ico');
      console.log('png-to-ico安装完成');
    }
    
    return true;
  } catch (error) {
    console.error('安装包时出错:', error.message);
    return false;
  }
}

// 生成图像
async function generateImages() {
  try {
    // 导入sharp和png-to-ico
    const sharp = require('sharp');
    const pngToIco = require('png-to-ico');
    
    const logoSvgPath = './public/images/fhir-map-logo.svg';
    const faviconSvgPath = './public/images/fhir-map-logo-favicon.svg';
    
    // 检查SVG文件是否存在
    if (!fs.existsSync(logoSvgPath) || !fs.existsSync(faviconSvgPath)) {
      console.error('错误: 找不到SVG源文件。请确保以下文件存在:');
      console.error(`- ${logoSvgPath}`);
      console.error(`- ${faviconSvgPath}`);
      return false;
    }
    
    console.log('从SVG生成PNG图像...');
    
    // 生成不同尺寸的PNG
    const sizes = [16, 32, 64, 96, 128, 256, 512];
    
    for (const size of sizes) {
      await sharp(logoSvgPath)
        .resize(size, size)
        .png()
        .toFile(`./public/images/fhir-map-logo-${size}.png`);
      console.log(`生成: fhir-map-logo-${size}.png`);
    }
    
    // 生成favicon.ico
    console.log('生成favicon.ico文件...');
    
    // 先创建16x16和32x32的PNG用于favicon
    await sharp(faviconSvgPath)
      .resize(16, 16)
      .png()
      .toFile('./public/images/favicon-16.png');
      
    await sharp(faviconSvgPath)
      .resize(32, 32)
      .png()
      .toFile('./public/images/favicon-32.png');
    
    // 使用png-to-ico将PNG转换为ICO
    const icoBuffer = await pngToIco([
      './public/images/favicon-16.png',
      './public/images/favicon-32.png'
    ]);
    
    fs.writeFileSync('./public/images/favicon.ico', icoBuffer);
    console.log('生成: favicon.ico');
    
    // 删除临时文件
    fs.unlinkSync('./public/images/favicon-16.png');
    fs.unlinkSync('./public/images/favicon-32.png');
    
    return true;
  } catch (error) {
    console.error('生成图像时出错:', error.message);
    return false;
  }
}

// 复制文件到其他目录
function copyFiles() {
  console.log('复制图像文件到其他目录...');
  
  const sourceDir = './public/images';
  const targetDirs = [
    './resources/images',
    './src/assets/images',
    './vscode-extension/resources/images'
  ];
  
  const filesToCopy = [
    'fhir-map-logo*.png',
    'fhir-map-logo*.svg',
    'favicon.ico'
  ];
  
  try {
    targetDirs.forEach(targetDir => {
      filesToCopy.forEach(pattern => {
        // 获取匹配的文件
        const files = fs.readdirSync(sourceDir)
          .filter(file => {
            // 使用简单的通配符匹配
            const regexPattern = pattern.replace('*', '.*');
            return new RegExp(regexPattern).test(file);
          });
        
        // 复制文件
        files.forEach(file => {
          const sourcePath = path.join(sourceDir, file);
          const targetPath = path.join(targetDir, file);
          
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`复制: ${sourcePath} -> ${targetPath}`);
        });
      });
    });
    
    return true;
  } catch (error) {
    console.error('复制文件时出错:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  // 安装包
  const packagesInstalled = await installPackages();
  if (!packagesInstalled) {
    console.error('无法安装必要的npm包，任务终止。');
    process.exit(1);
  }
  
  // 生成图像
  const imagesGenerated = await generateImages();
  if (!imagesGenerated) {
    console.error('无法生成图像文件，任务终止。');
    process.exit(1);
  }
  
  // 复制文件
  const filesCopied = copyFiles();
  if (!filesCopied) {
    console.error('无法复制图像文件，任务终止。');
    process.exit(1);
  }
  
  console.log('完成！所有图像文件已生成和复制到指定目录。');
}

main().catch(error => {
  console.error('执行过程中出错:', error);
  process.exit(1);
}); 