/**
 * 使用示例
 * 
 * 展示如何使用 API Providers 模块
 */

import {
  getProvider,
  getProviderManager,
  getAvailableProviders,
  VideoGenerationOptions,
} from './index';

/**
 * 示例 1: 基础使用 - 使用单个提供商生成视频
 */
async function example1_basicUsage() {
  console.log('=== 示例 1: 基础使用 ===\n');

  // 获取 Runway 提供商
  const provider = getProvider('runway');

  if (!provider) {
    console.error('提供商不可用');
    return;
  }

  // 验证 API 密钥
  const validateResult = await provider.validateApiKey();
  if (!validateResult.success) {
    console.error('API 密钥验证失败:', validateResult.error);
    return;
  }

  // 生成视频
  const prompt = '一只可爱的猫咪在阳光下玩耍，毛茸茸的，4K 画质';
  const options: VideoGenerationOptions = {
    duration: 4,
    resolution: '1080p',
    style: 'realistic',
  };

  console.log('正在生成视频...');
  const result = await provider.generateVideo(prompt, options);

  if (!result.success) {
    console.error('生成失败:', result.error);
    return;
  }

  const taskId = result.data as string;
  console.log('任务已创建，Task ID:', taskId);

  // 轮询检查状态
  console.log('等待视频生成完成...');
  while (true) {
    const statusResult = await provider.checkStatus(taskId);
    
    if (!statusResult.success) {
      console.error('检查状态失败:', statusResult.error);
      break;
    }

    const status = statusResult.data!;
    console.log(`状态：${status.status}, 进度：${status.progress || 0}%`);

    if (status.status === 'completed') {
      console.log('视频生成完成！');
      break;
    } else if (status.status === 'failed') {
      console.error('视频生成失败:', status.error);
      break;
    }

    // 等待 5 秒后再次检查
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 下载视频
  const downloadResult = await provider.downloadVideo(taskId, './output/video.mp4');
  if (downloadResult.success) {
    console.log('视频已下载:', downloadResult.data?.downloadUrl);
  }
}

/**
 * 示例 2: 使用提供商管理器
 */
async function example2_providerManager() {
  console.log('\n=== 示例 2: 提供商管理器 ===\n');

  const manager = getProviderManager();

  // 查看所有可用提供商
  const available = manager.getAvailableProviders();
  console.log('可用提供商:', available);

  // 查看所有提供商信息
  const allInfo = manager.getAllProviderInfo();
  console.log('\n所有提供商信息:');
  for (const info of allInfo) {
    console.log(`- ${info.name} (${info.key}):`);
    console.log(`  启用：${info.enabled}`);
    console.log(`  已配置：${info.configured}`);
    console.log(`  可用：${info.available}`);
  }

  // 使用管理器生成视频
  const result = await manager.generateVideo(
    'pika',
    '未来城市的夜景，霓虹灯闪烁，赛博朋克风格',
    {
      duration: 5,
      resolution: '720p',
      style: 'cyberpunk',
    }
  );

  if (result.success) {
    console.log('\n任务创建成功:', result.data);
  } else {
    console.error('任务创建失败:', result.error);
  }
}

/**
 * 示例 3: 多提供商故障转移
 */
async function example3_failover() {
  console.log('\n=== 示例 3: 多提供商故障转移 ===\n');

  const prompt = '壮丽的山川景色，云雾缭绕';
  const options: VideoGenerationOptions = {
    duration: 5,
    resolution: '1080p',
  };

  // 尝试多个提供商
  const providers = ['runway', 'pika', 'kling'];
  
  for (const providerName of providers) {
    console.log(`尝试使用 ${providerName}...`);
    
    const provider = getProvider(providerName);
    if (!provider) {
      console.log(`${providerName} 不可用，跳过`);
      continue;
    }

    const result = await provider.generateVideo(prompt, options);
    
    if (result.success) {
      console.log(`${providerName} 成功创建任务:`, result.data);
      return result.data;
    } else {
      console.log(`${providerName} 失败:`, result.error);
      // 继续尝试下一个提供商
    }
  }

  console.error('所有提供商都失败了');
  return null;
}

/**
 * 示例 4: 批量生成
 */
async function example4_batchGeneration() {
  console.log('\n=== 示例 4: 批量生成 ===\n');

  const prompts = [
    '宁静的湖泊，倒映着蓝天白云',
    '繁忙的都市街道，车水马龙',
    '神秘的森林，阳光透过树叶',
    '海滩日落，金色的阳光洒在海面上',
  ];

  const provider = getProvider('kling');
  if (!provider) {
    console.error('提供商不可用');
    return;
  }

  // 并发生成（注意 API 限流）
  const tasks = await Promise.all(
    prompts.map(async (prompt, index) => {
      console.log(`生成任务 ${index + 1}/${prompts.length}`);
      
      const result = await provider.generateVideo(prompt, {
        duration: 5,
        resolution: '720p',
      });

      return {
        index,
        prompt,
        result,
      };
    })
  );

  // 输出结果
  console.log('\n批量生成结果:');
  for (const task of tasks) {
    if (task.result.success) {
      console.log(`✓ 任务 ${task.index + 1}: ${task.result.data}`);
    } else {
      console.log(`✗ 任务 ${task.index + 1}: ${task.result.error}`);
    }
  }
}

/**
 * 示例 5: 带错误处理的完整流程
 */
async function example5_withErrorHandling() {
  console.log('\n=== 示例 5: 带错误处理的完整流程 ===\n');

  const provider = getProvider('runway');
  if (!provider) {
    console.error('提供商不可用');
    return;
  }

  try {
    // 1. 验证 API 密钥
    const validateResult = await provider.validateApiKey();
    if (!validateResult.success) {
      throw new Error(`API 密钥无效：${validateResult.error}`);
    }

    // 2. 生成视频
    const generateResult = await provider.generateVideo(
      '宇航员在太空中漂浮，地球在背景中',
      {
        duration: 4,
        resolution: '1080p',
        style: 'cinematic',
        negativePrompt: 'blurry, low quality',
      }
    );

    if (!generateResult.success) {
      throw new Error(`生成失败：${generateResult.error}`);
    }

    const taskId = generateResult.data as string;
    console.log('任务创建成功:', taskId);

    // 3. 等待完成（带超时）
    const maxWaitTime = 5 * 60 * 1000; // 5 分钟
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const statusResult = await provider.checkStatus(taskId);
      
      if (!statusResult.success) {
        throw new Error(`检查状态失败：${statusResult.error}`);
      }

      const status = statusResult.data!;
      console.log(`进度：${status.progress || 0}% - ${status.message}`);

      if (status.status === 'completed') {
        // 4. 下载视频
        const downloadResult = await provider.downloadVideo(
          taskId,
          `./output/video_${taskId}.mp4`
        );

        if (downloadResult.success) {
          console.log('✓ 视频下载成功!');
          console.log('  URL:', downloadResult.data?.downloadUrl);
          console.log('  时长:', downloadResult.data?.duration, '秒');
          console.log('  分辨率:', downloadResult.data?.resolution);
        }
        return;
      } else if (status.status === 'failed') {
        throw new Error(`视频生成失败：${status.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('等待超时');

  } catch (error) {
    console.error('❌ 错误:', error instanceof Error ? error.message : error);
  }
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  console.log('🎬 API Providers 使用示例\n');
  console.log('=====================================\n');

  // 取消注释以运行相应示例
  // await example1_basicUsage();
  // await example2_providerManager();
  // await example3_failover();
  // await example4_batchGeneration();
  await example5_withErrorHandling();

  console.log('\n=====================================');
  console.log('示例运行完成');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_basicUsage,
  example2_providerManager,
  example3_failover,
  example4_batchGeneration,
  example5_withErrorHandling,
  runAllExamples,
};
