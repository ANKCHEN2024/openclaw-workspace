/**
 * 类型定义文件
 * 定义所有 API 提供商共享的类型和接口
 */

/**
 * 视频生成选项
 */
export interface VideoGenerationOptions {
  /** 视频时长（秒） */
  duration?: number;
  /** 视频分辨率，如 "1080p", "720p" */
  resolution?: string;
  /** 帧率 */
  fps?: number;
  /** 风格提示 */
  style?: string;
  /** 负面提示（不希望出现的内容） */
  negativePrompt?: string;
  /** 种子值，用于可重复性 */
  seed?: number;
  /** 额外参数，不同提供商可能有不同需求 */
  extra?: Record<string, any>;
}

/**
 * 视频任务状态
 */
export type TaskStatus = 
  | 'pending'      // 等待中
  | 'processing'   // 处理中
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'cancelled';   // 已取消

/**
 * 任务状态信息
 */
export interface TaskStatusInfo {
  /** 任务 ID */
  taskId: string;
  /** 当前状态 */
  status: TaskStatus;
  /** 进度百分比（0-100） */
  progress?: number;
  /** 状态消息 */
  message?: string;
  /** 预计剩余时间（秒） */
  estimatedTimeRemaining?: number;
  /** 错误信息（如果失败） */
  error?: string;
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
}

/**
 * 视频信息
 */
export interface VideoInfo {
  /** 视频 ID */
  videoId: string;
  /** 下载 URL */
  downloadUrl: string;
  /** 预览 URL（可选） */
  previewUrl?: string;
  /** 视频时长（秒） */
  duration: number;
  /** 分辨率 */
  resolution: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 格式 */
  format?: string;
  /** 创建时间 */
  createdAt?: Date;
}

/**
 * API 响应结果（统一格式）
 */
export interface ApiResult<T> {
  /** 是否成功 */
  success: boolean;
  /** 数据（成功时） */
  data?: T;
  /** 错误信息（失败时） */
  error?: string;
  /** 错误代码 */
  errorCode?: string;
  /** 提供商名称 */
  provider: string;
  /** 请求 ID（用于追踪） */
  requestId?: string;
}

/**
 * 视频生成任务
 */
export interface GenerationTask {
  /** 任务 ID */
  taskId: string;
  /** 提示词 */
  prompt: string;
  /** 选项 */
  options: VideoGenerationOptions;
  /** 提供商 */
  provider: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * API 提供商配置
 */
export interface ProviderConfig {
  /** 提供商名称 */
  name: string;
  /** API 基础 URL */
  baseUrl: string;
  /** API 密钥环境变量名 */
  apiKeyEnvName: string;
  /** 是否启用 */
  enabled: boolean;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 额外配置 */
  extra?: Record<string, any>;
}

/**
 * API 提供商接口
 * 所有提供商必须实现此接口
 */
export interface IVideoProvider {
  /** 提供商名称 */
  readonly name: string;
  
  /**
   * 生成视频
   * @param prompt 提示词
   * @param options 生成选项
   * @returns 任务 ID 或视频信息
   */
  generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<ApiResult<string | VideoInfo>>;
  
  /**
   * 检查任务状态
   * @param taskId 任务 ID
   * @returns 任务状态信息
   */
  checkStatus(taskId: string): Promise<ApiResult<TaskStatusInfo>>;
  
  /**
   * 下载视频
   * @param videoId 视频 ID
   * @param savePath 保存路径（可选）
   * @returns 视频信息
   */
  downloadVideo(videoId: string, savePath?: string): Promise<ApiResult<VideoInfo>>;
  
  /**
   * 验证 API 密钥是否有效
   * @returns 是否有效
   */
  validateApiKey(): Promise<ApiResult<boolean>>;
}
