# 开发者文档

## 项目架构

```
cli/
├── bin/
│   └── cli.js           # 主 CLI 程序入口
├── data/
│   └── videos.json      # 本地视频数据（运行时生成）
├── package.json         # 项目配置和依赖
├── README.md           # 用户文档
├── QUICKSTART.md       # 快速入门指南
├── DEVELOPER.md        # 开发者文档（本文件）
├── api-example.js      # API 集成示例
├── config.example.json # 配置示例
└── demo.sh            # 演示脚本
```

## 技术栈

- **Node.js** - 运行时环境（>=14.0.0）
- **commander** - CLI 框架
- **chalk** - 终端彩色输出
- **ora** - 加载动画
- **inquirer** - 交互式命令行
- **conf** - 配置存储
- **axios** - HTTP 请求

## 核心模块

### 1. CLI 命令结构

所有命令在 `bin/cli.js` 中定义，使用 Commander.js 框架：

```javascript
const program = new Command();

program
  .command('command-name <arg>')
  .description('命令描述')
  .option('-o, --option <value>', '选项描述', '默认值')
  .action(async (arg, options) => {
    // 命令实现
  });
```

### 2. 配置管理

使用 `conf` 库管理用户配置：

```javascript
const Conf = require('conf');
const config = new Conf({
  projectName: 'short-video-cli',
  schema: {
    apiKey: { type: 'string', default: '' },
    provider: { type: 'string', default: 'default' }
  }
});

// 读取配置
const apiKey = config.get('apiKey');

// 写入配置
config.set('apiKey', 'new-key');
```

### 3. 数据存储

视频数据存储在 `data/videos.json`：

```javascript
const fs = require('fs');
const path = require('path');

const videoDataPath = path.join(__dirname, '..', 'data', 'videos.json');

function loadVideos() {
  const data = fs.readFileSync(videoDataPath, 'utf-8');
  return JSON.parse(data);
}

function saveVideos(videos) {
  fs.writeFileSync(videoDataPath, JSON.stringify(videos, null, 2));
}
```

## 添加新命令

### 步骤 1: 在 cli.js 中添加命令定义

```javascript
program
  .command('new-command <arg>')
  .alias('nc')
  .description('新命令描述')
  .option('-o, --option <value>', '选项描述', 'default')
  .action(async (arg, options) => {
    console.log(chalk.cyan('\n🔹 新命令\n'));
    
    // 实现逻辑
    const spinner = ora('处理中...').start();
    
    try {
      await someAsyncOperation();
      spinner.succeed('成功！');
    } catch (error) {
      spinner.fail('失败');
      throw error;
    }
  });
```

### 步骤 2: 更新帮助信息

在 `showHelpInfo()` 函数中添加新命令说明：

```javascript
console.log(`  ${chalk.green('new-command <arg>')}   新命令描述`);
```

### 步骤 3: 更新 README

在 README.md 中添加新命令的使用说明和示例。

## API 集成

### 当前状态

当前实现使用模拟数据，实际使用需要接入真实 API。

### 集成步骤

1. 参考 `api-example.js` 中的 API 客户端实现
2. 根据具体提供商的 API 文档调整请求格式
3. 在 `bin/cli.js` 中替换模拟调用为真实 API 调用

### 支持的提供商

- 阿里云视频生成
- 腾讯云智影
- 百度智能云
- 自定义提供商

## 测试

### 单元测试（待实现）

```bash
npm test
```

### 手动测试

```bash
# 查看帮助
node bin/cli.js --help

# 测试各命令
node bin/cli.js providers
node bin/cli.js list
node bin/cli.js config
```

### 演示脚本

```bash
./demo.sh
```

## 发布

### 本地开发

```bash
npm install
npm link
```

### 发布到 npm（可选）

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 发布
npm publish
```

## 代码风格

### 命名约定

- 文件名：kebab-case（如 `cli.js`, `api-example.js`）
- 变量名：camelCase
- 常量名：UPPER_SNAKE_CASE
- 类名：PascalCase

### 注释规范

```javascript
/**
 * 函数描述
 * @param {type} paramName - 参数描述
 * @returns {type} 返回值描述
 */
function myFunction(paramName) {
  // 实现
}
```

### 错误处理

```javascript
try {
  // 可能失败的代码
} catch (error) {
  console.log(chalk.red(`❌ 错误：${error.message}`));
  process.exit(1);
}
```

## 国际化

当前版本仅支持中文。如需支持多语言：

1. 创建 `locales/` 目录
2. 使用 `i18n` 库管理翻译
3. 根据系统语言或 `--lang` 选项加载对应语言包

## 性能优化

### 建议

1. 使用缓存减少 API 调用
2. 批量操作时使用并发控制
3. 大文件下载使用流式处理
4. 定期清理本地数据

### 示例：并发控制

```javascript
const pLimit = require('p-limit');
const limit = pLimit(5); // 最多 5 个并发

const promises = items.map(item => 
  limit(() => processItem(item))
);

await Promise.all(promises);
```

## 安全考虑

1. **API 密钥**：使用 `conf` 库安全存储，不提交到版本控制
2. **输入验证**：验证所有用户输入
3. **错误信息**：不暴露敏感信息
4. **权限检查**：文件操作前检查权限

## 故障排查

### 常见问题

1. **命令未找到**
   ```bash
   npm link
   ```

2. **权限错误**
   ```bash
   chmod +x bin/cli.js
   ```

3. **依赖问题**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 调试模式

```bash
# 查看详细错误
DEBUG=* node bin/cli.js <command>

# 或使用 node 直接运行
node --inspect bin/cli.js <command>
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

ISC
