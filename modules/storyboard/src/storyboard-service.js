/**
 * 分镜生成服务
 * 
 * 核心业务逻辑：接收剧本描述，生成分镜图像序列
 * 
 * @module services/storyboard-service
 */

const WanXClient = require('./wanx-client');
const { v4: uuidv4 } = require('uuid');

class StoryboardService {
  constructor(config = {}) {
    this.wanxClient = new WanXClient(config.aliyun);
    this.storage = config.storage; // MinIO 客户端
    this.db = config.db; // 数据库连接
    
    // 默认配置
    this.defaultConfig = {
      aspectRatio: '16:9',
      quality: 'high',
      style: '电影感写实',
      countPerAngle: 4,
      consistencyThreshold: 85
    };
  }

  /**
   * 生成分镜
   * 
   * @param {Object} request - 生成请求
   * @returns {Promise<Object>} 分镜生成结果
   */
  async generateStoryboard(request) {
    const {
      projectId,
      sceneId,
      sceneDescription,
      characters,
      action,
      cameraAngles,
      countPerAngle = this.defaultConfig.countPerAngle,
      style = this.defaultConfig.style,
      aspectRatio = this.defaultConfig.aspectRatio,
      quality = this.defaultConfig.quality
    } = request;

    // 1. 创建分镜记录
    const storyboardId = `sb_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const storyboard = await this._createStoryboardRecord({
      id: storyboardId,
      projectId,
      sceneId,
      sceneDescription,
      characters,
      action,
      cameraAngles,
      status: 'pending'
    });

    // 2. 为每个镜头角度生成提示词
    const generationTasks = [];
    
    for (const angle of cameraAngles) {
      const prompt = this.wanxClient.buildPrompt({
        sceneDescription,
        characters,
        action,
        cameraAngle: angle,
        style,
        aspectRatio,
        quality
      });

      const negativePrompt = this.wanxClient.getDefaultNegativePrompt();
      
      // 使用固定种子确保一致性
      const seed = this.wanxClient.generateConsistentSeed(
        `${projectId}_${sceneId}`,
        'storyboard_v1'
      );

      generationTasks.push({
        angle,
        prompt,
        negativePrompt,
        seed
      });
    }

    // 3. 并行调用 API 生成图像
    const generationResults = await this._generateImages(generationTasks, countPerAngle);

    // 4. 下载图像到存储
    const imageRecords = await this._downloadAndStoreImages(storyboardId, generationResults);

    // 5. 计算一致性分数
    const consistencyScores = this._calculateConsistency(imageRecords);

    // 6. 更新分镜记录
    const updatedStoryboard = await this._updateStoryboard(storyboardId, {
      images: imageRecords,
      consistencyScores,
      status: 'completed',
      generatedAt: new Date()
    });

    return {
      success: true,
      data: {
        storyboardId,
        status: 'completed',
        images: imageRecords,
        consistencyScores,
        sequenceNumber: updatedStoryboard.sequenceNumber
      }
    };
  }

  /**
   * 异步生成分镜（返回任务 ID）
   * 
   * @param {Object} request - 生成请求
   * @returns {Promise<Object>} 任务信息
   */
  async generateStoryboardAsync(request) {
    const taskId = `task_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    
    // 将任务推入队列（这里简化处理，实际应使用 Redis 队列）
    await this._enqueueTask(taskId, request);

    return {
      success: true,
      data: {
        taskId,
        status: 'queued',
        estimatedTime: this._estimateGenerationTime(request.cameraAngles.length)
      }
    };
  }

  /**
   * 查询任务状态
   * 
   * @param {string} taskId - 任务 ID
   * @returns {Promise<Object>} 任务状态
   */
  async getTaskStatus(taskId) {
    const task = await this._getTask(taskId);
    
    if (!task) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '任务不存在' }
      };
    }

    return {
      success: true,
      data: {
        taskId,
        status: task.status,
        progress: task.progress,
        storyboardId: task.storyboardId,
        completedAngles: task.completedAngles || [],
        pendingAngles: task.pendingAngles || []
      }
    };
  }

  /**
   * 获取分镜详情
   * 
   * @param {string} storyboardId - 分镜 ID
   * @returns {Promise<Object>} 分镜详情
   */
  async getStoryboard(storyboardId) {
    const storyboard = await this._getStoryboardById(storyboardId);
    
    if (!storyboard) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '分镜不存在' }
      };
    }

    return {
      success: true,
      data: storyboard
    };
  }

  /**
   * 选择分镜图像
   * 
   * @param {string} storyboardId - 分镜 ID
   * @param {string} imageId - 图像 ID
   * @param {string} cameraAngle - 镜头角度
   * @returns {Promise<Object>} 更新结果
   */
  async selectImage(storyboardId, imageId, cameraAngle) {
    const storyboard = await this._getStoryboardById(storyboardId);
    
    if (!storyboard) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '分镜不存在' }
      };
    }

    // 更新选中状态
    await this._updateSelectedImage(storyboardId, imageId, cameraAngle);

    return {
      success: true,
      data: {
        storyboardId,
        selectedImageId: imageId,
        cameraAngle
      }
    };
  }

  /**
   * 重新生成分镜
   * 
   * @param {string} storyboardId - 分镜 ID
   * @param {Object} options - 重新生成选项
   * @returns {Promise<Object>} 生成结果
   */
  async regenerateStoryboard(storyboardId, options = {}) {
    const {
      cameraAngles,
      count = 4,
      seed
    } = options;

    const storyboard = await this._getStoryboardById(storyboardId);
    
    if (!storyboard) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '分镜不存在' }
      };
    }

    // 使用原有参数，更新种子
    const newSeed = seed || this.wanxClient.generateConsistentSeed(
      `${storyboard.projectId}_${storyboard.sceneId}`,
      `regenerate_${Date.now()}`
    );

    // 重新生成指定角度的图像
    const generationTasks = cameraAngles.map(angle => ({
      angle,
      prompt: this.wanxClient.buildPrompt({
        sceneDescription: storyboard.sceneDescription,
        characters: storyboard.characters,
        action: storyboard.action,
        cameraAngle: angle,
        style: this.defaultConfig.style,
        aspectRatio: this.defaultConfig.aspectRatio,
        quality: this.defaultConfig.quality
      }),
      negativePrompt: this.wanxClient.getDefaultNegativePrompt(),
      seed: newSeed
    }));

    const generationResults = await this._generateImages(generationTasks, count);
    const imageRecords = await this._downloadAndStoreImages(storyboardId, generationResults);

    return {
      success: true,
      data: {
        storyboardId,
        images: imageRecords,
        seed: newSeed
      }
    };
  }

  /**
   * 计算一致性分数
   * 
   * @private
   * @param {Array} images - 图像记录
   * @returns {Object} 一致性分数
   */
  _calculateConsistency(images) {
    // 简化版本：实际应使用 CLIP 模型计算特征相似度
    const scores = {};
    
    // 按镜头角度分组
    const grouped = images.reduce((acc, img) => {
      if (!acc[img.cameraAngle]) {
        acc[img.cameraAngle] = [];
      }
      acc[img.cameraAngle].push(img);
      return acc;
    }, {});

    // 计算每个角度内的相似度
    for (const [angle, angleImages] of Object.entries(grouped)) {
      if (angleImages.length > 1) {
        // 计算第一张与其他张的平均相似度
        const baseImage = angleImages[0];
        const similarities = angleImages.slice(1).map(img => {
          // 简化：使用哈希相似度（实际应使用 CLIP embedding）
          return this._calculateImageSimilarity(baseImage, img);
        });
        
        scores[angle] = {
          average: similarities.reduce((a, b) => a + b, 0) / similarities.length,
          min: Math.min(...similarities),
          max: Math.max(...similarities)
        };
      }
    }

    return scores;
  }

  /**
   * 计算两张图像的相似度（简化版本）
   * 
   * @private
   * @param {Object} img1 - 图像 1
   * @param {Object} img2 - 图像 2
   * @returns {number} 相似度分数 (0-100)
   */
  _calculateImageSimilarity(img1, img2) {
    // 简化：基于种子和提示词的相似度
    // 实际应使用 CLIP 模型计算视觉特征相似度
    
    const seedDiff = Math.abs(img1.seed - img2.seed);
    const promptSimilarity = this._calculateTextSimilarity(
      img1.prompt,
      img2.prompt
    );

    // 种子越接近，分数越高；提示词越相似，分数越高
    const seedScore = Math.max(0, 100 - seedDiff / 1000000);
    const combinedScore = (seedScore * 0.3 + promptSimilarity * 0.7);

    return Math.round(combinedScore * 100) / 100;
  }

  /**
   * 计算文本相似度（简化版本）
   * 
   * @private
   * @param {string} text1 - 文本 1
   * @param {string} text2 - 文本 2
   * @returns {number} 相似度 (0-1)
   */
  _calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/[\s,，]+/));
    const words2 = new Set(text2.toLowerCase().split(/[\s,，]+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 生成图像（调用 API）
   * 
   * @private
   * @param {Array} tasks - 生成任务列表
   * @param {number} countPerAngle - 每个角度生成数量
   * @returns {Array} 生成结果
   */
  async _generateImages(tasks, countPerAngle) {
    const results = [];

    for (const task of tasks) {
      const { angle, prompt, negativePrompt, seed } = task;

      // 调用通义万相 API
      const apiResult = await this.wanxClient.generateImage({
        prompt,
        negativePrompt,
        size: this._aspectRatioToSize(this.defaultConfig.aspectRatio),
        count: countPerAngle,
        seed: seed + this._angleToOffset(angle) // 不同角度的种子偏移
      });

      if (!apiResult.success) {
        results.push({
          angle,
          success: false,
          error: apiResult.error
        });
        continue;
      }

      // 等待任务完成
      const completionResult = await this.wanxClient.waitForCompletion(apiResult.taskId, {
        interval: 3000,
        timeout: 120000
      });

      if (!completionResult.success) {
        results.push({
          angle,
          success: false,
          error: { message: completionResult.message }
        });
        continue;
      }

      results.push({
        angle,
        success: true,
        images: completionResult.images.map(url => ({
          url,
          prompt,
          seed: seed + this._angleToOffset(angle)
        }))
      });
    }

    return results;
  }

  /**
   * 下载并存储图像
   * 
   * @private
   * @param {string} storyboardId - 分镜 ID
   * @param {Array} generationResults - 生成结果
   * @returns {Array} 图像记录
   */
  async _downloadAndStoreImages(storyboardId, generationResults) {
    const imageRecords = [];

    for (const result of generationResults) {
      if (!result.success || !result.images) continue;

      for (let i = 0; i < result.images.length; i++) {
        const img = result.images[i];
        const imageId = `img_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

        // 下载图像
        const imageBuffer = await this._downloadImage(img.url);
        
        // 上传到 MinIO
        const storedUrl = await this.storage.upload(
          `storyboards/${storyboardId}/${imageId}.jpg`,
          imageBuffer,
          { contentType: 'image/jpeg' }
        );

        // 生成缩略图
        const thumbnailUrl = await this._generateThumbnail(imageBuffer, storyboardId, imageId);

        imageRecords.push({
          id: imageId,
          storyboardId,
          url: storedUrl,
          thumbnailUrl,
          cameraAngle: result.angle,
          prompt: img.prompt,
          seed: img.seed,
          width: 1280,
          height: 720,
          format: 'jpg',
          fileSize: imageBuffer.length,
          isSelected: i === 0, // 默认选中第一张
          createdAt: new Date()
        });
      }
    }

    return imageRecords;
  }

  /**
   * 数据库操作（临时内存存储，待替换为真实数据库）
   * TODO: 使用 PostgreSQL/MongoDB 实现持久化存储
   */
  constructor(config = {}) {
    this.wanxClient = new WanXClient(config.aliyun);
    this.storage = config.storage; // MinIO 客户端
    this.db = config.db; // 数据库连接
    
    // 临时内存存储（开发环境使用）
    this._memoryStore = {
      storyboards: new Map(),
      tasks: new Map()
    };
    
    // 默认配置
    this.defaultConfig = {
      aspectRatio: '16:9',
      quality: 'high',
      style: '电影感写实',
      countPerAngle: 4,
      consistencyThreshold: 85
    };
  }

  async _createStoryboardRecord(data) {
    const record = {
      ...data,
      sequenceNumber: this._memoryStore.storyboards.size + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this._memoryStore.storyboards.set(data.id, record);
    return record;
  }

  async _updateStoryboard(storyboardId, updates) {
    const existing = this._memoryStore.storyboards.get(storyboardId);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this._memoryStore.storyboards.set(storyboardId, updated);
    return updated;
  }

  async _getStoryboardById(storyboardId) {
    return this._memoryStore.storyboards.get(storyboardId) || null;
  }

  async _updateSelectedImage(storyboardId, imageId, cameraAngle) {
    const storyboard = await this._getStoryboardById(storyboardId);
    if (!storyboard) return false;
    
    const imageIndex = storyboard.images?.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return false;
    
    storyboard.images[imageIndex].selected = true;
    storyboard.selectedImage = { imageId, cameraAngle };
    await this._updateStoryboard(storyboardId, storyboard);
    return true;
  }

  async _enqueueTask(taskId, request) {
    const task = {
      taskId,
      request,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this._memoryStore.tasks.set(taskId, task);
    return { taskId, status: 'queued' };
  }

  async _getTask(taskId) {
    return this._memoryStore.tasks.get(taskId) || null;
  }

  /**
   * 工具函数
   */
  _aspectRatioToSize(aspectRatio) {
    const sizeMap = {
      '16:9': '1280*720',
      '9:16': '720*1280',
      '4:3': '1024*768',
      '1:1': '1024*1024'
    };
    return sizeMap[aspectRatio] || '1280*720';
  }

  _angleToOffset(angle) {
    const offsetMap = {
      'extreme_long_shot': 0,
      'long_shot': 1000,
      'full_shot': 2000,
      'medium_long_shot': 3000,
      'medium_shot': 4000,
      'medium_close_up': 5000,
      'close_up': 6000,
      'extreme_close_up': 7000
    };
    return offsetMap[angle] || 0;
  }

  _estimateGenerationTime(angleCount) {
    // 每个角度约 30 秒
    return angleCount * 30;
  }

  async _downloadImage(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`下载图像失败 ${url}:`, error.message);
      return Buffer.from('placeholder-image');
    }
  }

  async _generateThumbnail(imageBuffer, storyboardId, imageId) {
    try {
      // 简单缩略图生成（使用 sharp 库）
      // 安装：npm install sharp
      const sharp = require('sharp');
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // 上传到存储
      const thumbnailKey = `thumbnails/${storyboardId}/${imageId}_thumb.jpg`;
      await this.storage.putObject(thumbnailKey, thumbnailBuffer, 'image/jpeg');
      
      return this.storage.getObjectUrl(thumbnailKey);
    } catch (error) {
      console.error(`生成缩略图失败:`, error.message);
      // 返回原图 URL 作为后备
      return `https://storage.example.com/images/${storyboardId}/${imageId}.jpg`;
    }
  }

  /**
   * 获取分镜列表
   */
  async listStoryboards(filters = {}) {
    const { projectId, sceneId, limit = 20, offset = 0 } = filters;
    
    // 从内存存储中过滤
    const all = Array.from(this._memoryStore.storyboards.values());
    const filtered = all.filter(sb => {
      if (projectId && sb.projectId !== projectId) return false;
      if (sceneId && sb.sceneId !== sceneId) return false;
      return true;
    });
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * 统计分镜数量
   */
  async countStoryboards(filters = {}) {
    const { projectId, sceneId } = filters;
    
    const all = Array.from(this._memoryStore.storyboards.values());
    return all.filter(sb => {
      if (projectId && sb.projectId !== projectId) return false;
      if (sceneId && sb.sceneId !== sceneId) return false;
      return true;
    }).length;
  }
}

module.exports = StoryboardService;
