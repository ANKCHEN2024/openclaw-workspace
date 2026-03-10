#!/usr/bin/env node

/**
 * 短视频生成平台 CLI 工具
 * 
 * 功能：
 * - generate <prompt> - 生成视频
 * - list - 列出所有视频
 * - show <id> - 显示视频详情
 * - download <id> - 下载视频
 * - delete <id> - 删除视频
 * - config - 配置 API 密钥
 * - providers - 列出支持的提供商
 * - status <task-id> - 查看生成状态
 */

const { Command } = require('commander');
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;
const oraModule = require('ora');
const ora = oraModule.default || oraModule;
const inquirerModule = require('inquirer');
const inquirer = inquirerModule.default || inquirerModule;
const axiosModule = require('axios');
const axios = axiosModule.default || axiosModule;
const ConfModule = require('conf');
const Conf = ConfModule.default || ConfModule;
const fs = require('fs');
const path = require('path');

// 初始化配置存储
const config = new Conf({
  projectName: 'short-video-cli',
  schema: {
    apiKey: { type: 'string', default: '' },
    apiSecret: { type: 'string', default: '' },
    baseUrl: { type: 'string', default: 'https://api.shortvideo.com' },
    provider: { type: 'string', default: 'default' }
  }
});

// 支持的提供商列表
const PROVIDERS = [
  { name: '阿里云视频生成', value: 'aliyun', endpoint: 'https://video.aliyuncs.com' },
  { name: '腾讯云智影', value: 'tencent', endpoint: 'https://api.tencentcloud.com' },
  { name: '百度智能云', value: 'baidu', endpoint: 'https://cloud.baidu.com' },
  { name: '默认提供商', value: 'default', endpoint: 'https://api.shortvideo.com' }
];

// 模拟视频数据存储（实际应使用 API）
const videoDataPath = path.join(__dirname, '..', 'data', 'videos.json');

// 确保数据目录存在
const dataDir = path.dirname(videoDataPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化视频数据文件
if (!fs.existsSync(videoDataPath)) {
  fs.writeFileSync(videoDataPath, JSON.stringify([], null, 2));
}

// 读取视频数据
function loadVideos() {
  try {
    const data = fs.readFileSync(videoDataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 保存视频数据
function saveVideos(videos) {
  fs.writeFileSync(videoDataPath, JSON.stringify(videos, null, 2));
}

// 生成唯一 ID
function generateId() {
  return 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 格式化日期
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN');
}

// 显示帮助信息
function showHelpInfo() {
  console.log(chalk.cyan('\n========================================'));
  console.log(chalk.cyan('     短视频生成平台 CLI 工具'));
  console.log(chalk.cyan('========================================\n'));
  
  console.log(chalk.yellow('用法:'));
  console.log('  short-video <command> [options]\n');
  
  console.log(chalk.yellow('可用命令:'));
  console.log(`  ${chalk.green('generate <prompt>')}   根据提示生成视频`);
  console.log(`  ${chalk.green('list')}                列出所有视频`);
  console.log(`  ${chalk.green('show <id>')}           显示视频详情`);
  console.log(`  ${chalk.green('download <id>')}       下载视频`);
  console.log(`  ${chalk.green('delete <id>')}         删除视频`);
  console.log(`  ${chalk.green('config')}              配置 API 密钥`);
  console.log(`  ${chalk.green('providers')}           列出支持的提供商`);
  console.log(`  ${chalk.green('status <task-id>')}    查看生成状态\n`);
  
  console.log(chalk.yellow('示例:'));
  console.log('  short-video generate "一只可爱的小猫在草地上玩耍"');
  console.log('  short-video list');
  console.log('  short-video show vid_1234567890_abc');
  console.log('  short-video download vid_1234567890_abc');
  console.log('  short-video delete vid_1234567890_abc');
  console.log('  short-video config');
  console.log('  short-video providers');
  console.log('  short-video status task_123456\n');
  
  console.log(chalk.yellow('提示:'));
  console.log('  首次使用前请运行 ' + chalk.green('short-video config') + ' 配置 API 密钥\n');
}

// 主程序
const program = new Command();

program
  .name('short-video')
  .description('短视频生成平台 CLI 工具 - 快速生成、管理和下载 AI 视频')
  .version('1.0.0');

// generate 命令 - 生成视频
program
  .command('generate <prompt>')
  .alias('g')
  .description('根据文本提示生成视频')
  .option('-p, --provider <provider>', '指定视频生成提供商')
  .option('-d, --duration <seconds>', '视频时长（秒）', '15')
  .option('-r, --resolution <resolution>', '视频分辨率', '1080p')
  .option('-b, --batch <count>', '批量生成数量', '1')
  .action(async (prompt, options) => {
    console.log(chalk.cyan('\n🎬 开始生成视频...\n'));
    
    // 检查配置
    if (!config.get('apiKey')) {
      console.log(chalk.red('❌ 错误：未配置 API 密钥'));
      console.log(chalk.yellow('请先运行：short-video config\n'));
      process.exit(1);
    }
    
    const provider = options.provider || config.get('provider') || 'default';
    const duration = parseInt(options.duration);
    const resolution = options.resolution;
    const batchCount = parseInt(options.batch);
    
    console.log(chalk.gray(`提示词：${chalk.white(prompt)}`));
    console.log(chalk.gray(`提供商：${chalk.white(provider)}`));
    console.log(chalk.gray(`时长：${chalk.white(duration + '秒')}`));
    console.log(chalk.gray(`分辨率：${chalk.white(resolution)}`));
    console.log(chalk.gray(`批量数量：${chalk.white(batchCount)}\n`));
    
    const videos = [];
    
    for (let i = 0; i < batchCount; i++) {
      if (batchCount > 1) {
        console.log(chalk.cyan(`\n📹 生成第 ${i + 1}/${batchCount} 个视频...\n`));
      }
      
      // 显示进度条
      const spinner = ora('正在连接 API...').start();
      
      try {
        // 模拟 API 调用（实际应调用真实 API）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        spinner.text = '正在生成视频...';
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        spinner.text = '正在处理视频...';
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        spinner.succeed('视频生成成功！');
        
        // 创建视频记录
        const video = {
          id: generateId(),
          prompt: prompt,
          provider: provider,
          duration: duration,
          resolution: resolution,
          status: 'completed',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          downloadUrl: `https://cdn.shortvideo.com/videos/${generateId()}.mp4`,
          thumbnailUrl: `https://cdn.shortvideo.com/thumbnails/${generateId()}.jpg`,
          fileSize: Math.floor(Math.random() * 50 + 10) + 'MB'
        };
        
        videos.push(video);
        
        // 保存到本地
        const allVideos = loadVideos();
        allVideos.push(video);
        saveVideos(allVideos);
        
        console.log(chalk.green(`\n✅ 视频 ID: ${chalk.bold(video.id)}`));
        console.log(chalk.gray(`   创建时间：${formatDate(video.createdAt)}`));
        console.log(chalk.gray(`   文件大小：${video.fileSize}\n`));
        
      } catch (error) {
        spinner.fail('视频生成失败');
        console.log(chalk.red(`错误：${error.message}\n`));
      }
    }
    
    if (videos.length > 0) {
      console.log(chalk.cyan('========================================'));
      console.log(chalk.green(`✓ 成功生成 ${videos.length} 个视频`));
      console.log(chalk.cyan('========================================\n'));
      
      if (batchCount > 1) {
        console.log(chalk.yellow('生成的视频 ID 列表:'));
        videos.forEach(v => console.log(`  - ${v.id}`));
        console.log('');
      }
    }
  });

// list 命令 - 列出所有视频
program
  .command('list')
  .alias('ls')
  .description('列出所有视频')
  .option('-s, --status <status>', '按状态筛选')
  .option('-l, --limit <number>', '限制显示数量', '10')
  .action((options) => {
    console.log(chalk.cyan('\n📋 视频列表\n'));
    
    const videos = loadVideos();
    let filteredVideos = videos;
    
    if (options.status) {
      filteredVideos = videos.filter(v => v.status === options.status);
    }
    
    const limit = parseInt(options.limit);
    const displayVideos = filteredVideos.slice(0, limit);
    
    if (displayVideos.length === 0) {
      console.log(chalk.yellow('暂无视频\n'));
      console.log(chalk.gray('提示：使用 ' + chalk.green('short-video generate "提示词"') + ' 生成第一个视频\n'));
      return;
    }
    
    console.log(chalk.gray(`共 ${filteredVideos.length} 个视频，显示前 ${displayVideos.length} 个\n`));
    console.log(chalk.gray('─'.repeat(80)));
    
    displayVideos.forEach((video, index) => {
      const statusColor = video.status === 'completed' ? chalk.green : 
                         video.status === 'processing' ? chalk.yellow : 
                         chalk.red;
      
      console.log(chalk.cyan(`${index + 1}. ${chalk.bold(video.id)}`));
      console.log(`   提示词：${chalk.white(video.prompt.substring(0, 50) + (video.prompt.length > 50 ? '...' : ''))}`);
      console.log(`   状态：${statusColor(video.status)}`);
      console.log(`   时长：${video.duration}秒 | 分辨率：${video.resolution}`);
      console.log(`   创建时间：${formatDate(video.createdAt)}`);
      console.log(chalk.gray('─'.repeat(80)));
    });
    
    console.log('');
  });

// show 命令 - 显示视频详情
program
  .command('show <id>')
  .alias('info')
  .description('显示视频详情')
  .action((id) => {
    console.log(chalk.cyan('\n📊 视频详情\n'));
    
    const videos = loadVideos();
    const video = videos.find(v => v.id === id);
    
    if (!video) {
      console.log(chalk.red(`❌ 错误：未找到视频 ${id}\n`));
      console.log(chalk.gray('提示：使用 ' + chalk.green('short-video list') + ' 查看所有视频\n'));
      process.exit(1);
    }
    
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.cyan.bold(`视频 ID: ${video.id}`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow('提示词:') + ` ${chalk.white(video.prompt)}`);
    console.log(chalk.yellow('状态:') + ` ${chalk.green(video.status)}`);
    console.log(chalk.yellow('提供商:') + ` ${chalk.white(video.provider)}`);
    console.log(chalk.yellow('时长:') + ` ${chalk.white(video.duration + '秒')}`);
    console.log(chalk.yellow('分辨率:') + ` ${chalk.white(video.resolution)}`);
    console.log(chalk.yellow('文件大小:') + ` ${chalk.white(video.fileSize)}`);
    console.log(chalk.yellow('创建时间:') + ` ${chalk.white(formatDate(video.createdAt))}`);
    console.log(chalk.yellow('更新时间:') + ` ${chalk.white(formatDate(video.updatedAt))}`);
    console.log(chalk.yellow('下载链接:') + ` ${chalk.underline.blue(video.downloadUrl)}`);
    console.log(chalk.yellow('缩略图:') + ` ${chalk.underline.blue(video.thumbnailUrl)}`);
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');
  });

// download 命令 - 下载视频
program
  .command('download <id>')
  .alias('dl')
  .description('下载视频')
  .option('-o, --output <path>', '保存路径')
  .action(async (id, options) => {
    console.log(chalk.cyan('\n⬇️  下载视频\n'));
    
    const videos = loadVideos();
    const video = videos.find(v => v.id === id);
    
    if (!video) {
      console.log(chalk.red(`❌ 错误：未找到视频 ${id}\n`));
      process.exit(1);
    }
    
    if (video.status !== 'completed') {
      console.log(chalk.yellow('⚠️  视频尚未生成完成，当前状态：' + video.status + '\n'));
      process.exit(1);
    }
    
    const outputPath = options.output || `./${video.id}.mp4`;
    
    console.log(chalk.gray(`视频 ID: ${video.id}`));
    console.log(chalk.gray(`保存路径：${outputPath}`));
    console.log(chalk.gray(`文件大小：${video.fileSize}\n`));
    
    const spinner = ora('正在下载...').start();
    
    try {
      // 模拟下载过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      spinner.succeed('下载完成！');
      console.log(chalk.green(`\n✅ 视频已保存到：${chalk.bold(outputPath)}\n`));
      
    } catch (error) {
      spinner.fail('下载失败');
      console.log(chalk.red(`错误：${error.message}\n`));
      process.exit(1);
    }
  });

// delete 命令 - 删除视频
program
  .command('delete <id>')
  .alias('rm')
  .description('删除视频')
  .option('-f, --force', '强制删除，不确认')
  .action(async (id, options) => {
    console.log(chalk.cyan('\n🗑️  删除视频\n'));
    
    const videos = loadVideos();
    const videoIndex = videos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      console.log(chalk.red(`❌ 错误：未找到视频 ${id}\n`));
      process.exit(1);
    }
    
    const video = videos[videoIndex];
    
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定要删除视频 "${video.prompt.substring(0, 30)}..." 吗？`,
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('已取消删除\n'));
        return;
      }
    }
    
    videos.splice(videoIndex, 1);
    saveVideos(videos);
    
    console.log(chalk.green('✅ 视频删除成功\n'));
  });

// config 命令 - 配置 API 密钥
program
  .command('config')
  .description('配置 API 密钥和设置')
  .action(async () => {
    console.log(chalk.cyan('\n⚙️  API 配置向导\n'));
    
    const questions = [
      {
        type: 'input',
        name: 'apiKey',
        message: 'API Key:',
        default: config.get('apiKey') || undefined,
        mask: '*'
      },
      {
        type: 'input',
        name: 'apiSecret',
        message: 'API Secret:',
        default: config.get('apiSecret') || undefined,
        mask: '*'
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'API 基础 URL:',
        default: config.get('baseUrl') || 'https://api.shortvideo.com'
      },
      {
        type: 'list',
        name: 'provider',
        message: '选择默认提供商:',
        choices: PROVIDERS.map(p => ({ name: p.name, value: p.value })),
        default: PROVIDERS.findIndex(p => p.value === config.get('provider'))
      }
    ];
    
    const answers = await inquirer.prompt(questions);
    
    // 保存配置
    config.set('apiKey', answers.apiKey);
    config.set('apiSecret', answers.apiSecret);
    config.set('baseUrl', answers.baseUrl);
    config.set('provider', answers.provider);
    
    console.log(chalk.green('\n✅ 配置已保存\n'));
    console.log(chalk.gray('配置文件位置：' + config.path + '\n'));
  });

// providers 命令 - 列出支持的提供商
program
  .command('providers')
  .alias('prov')
  .description('列出支持的提供商')
  .action(() => {
    console.log(chalk.cyan('\n🌐 支持的提供商\n'));
    
    const currentProvider = config.get('provider');
    
    PROVIDERS.forEach((provider, index) => {
      const isCurrent = provider.value === currentProvider;
      const icon = isCurrent ? chalk.green('✓') : chalk.gray('○');
      
      console.log(`${icon} ${chalk.bold(provider.name)}`);
      console.log(`   ID: ${chalk.white(provider.value)}`);
      console.log(`   端点：${chalk.gray(provider.endpoint)}`);
      
      if (isCurrent) {
        console.log(chalk.green('   ← 当前使用'));
      }
      
      if (index < PROVIDERS.length - 1) {
        console.log('');
      }
    });
    
    console.log('\n' + chalk.gray('提示：使用 ' + chalk.green('short-video config') + ' 更改默认提供商\n'));
  });

// status 命令 - 查看生成状态
program
  .command('status <task-id>')
  .description('查看视频生成状态')
  .action(async (taskId) => {
    console.log(chalk.cyan('\n📊 生成状态\n'));
    
    const videos = loadVideos();
    const video = videos.find(v => v.id === taskId || v.taskId === taskId);
    
    if (!video) {
      console.log(chalk.red(`❌ 错误：未找到任务 ${taskId}\n`));
      process.exit(1);
    }
    
    console.log(chalk.gray('任务 ID: ' + video.id));
    console.log(chalk.gray('提示词：' + video.prompt));
    console.log('');
    
    // 显示状态
    const statusMessages = {
      'pending': chalk.yellow('⏳ 等待中'),
      'processing': chalk.blue('🔄 处理中'),
      'completed': chalk.green('✅ 已完成'),
      'failed': chalk.red('❌ 失败')
    };
    
    console.log(`状态：${statusMessages[video.status] || chalk.gray(video.status)}`);
    
    if (video.status === 'processing') {
      const progress = Math.floor(Math.random() * 30) + 50; // 模拟进度
      console.log(`进度：${progress}%`);
      
      // 显示进度条
      const barLength = 30;
      const filledLength = Math.floor((progress / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(chalk.cyan(`[${bar}]`));
    }
    
    console.log(`创建时间：${formatDate(video.createdAt)}`);
    console.log(`更新时间：${formatDate(video.updatedAt)}`);
    
    if (video.status === 'completed') {
      console.log(chalk.green('\n✓ 视频已准备就绪，可以下载'));
    } else if (video.status === 'failed') {
      console.log(chalk.red('\n✗ 视频生成失败'));
    }
    
    console.log('');
  });

// 处理未知命令
program.on('command:*', () => {
  console.log(chalk.red('\n❌ 未知命令\n'));
  showHelpInfo();
  process.exit(1);
});

// 如果没有提供参数，显示帮助
if (process.argv.length <= 2) {
  showHelpInfo();
  process.exit(0);
}

program.parse();
