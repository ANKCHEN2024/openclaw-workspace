import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../config/Config';
import { ActionType, Observation } from '../core/types';
import { StateManager } from '../state/StateManager';

/**
 * 任务执行器
 * 支持 API 调用和文件操作
 */
export interface Task {
  id: string;
  type: 'api_call' | 'file_read' | 'file_write' | 'file_delete' | 'custom';
  description: string;
  parameters: Record<string, any>;
  priority: number;
  createdAt: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  cost: number;
  duration: number;
}

export class TaskExecutor {
  private readonly config: Config;
  private stateManager: StateManager;
  private taskQueue: Task[] = [];
  private isExecuting: boolean = false;

  constructor(stateManager: StateManager) {
    this.config = Config.getInstance();
    this.stateManager = stateManager;
  }

  /**
   * 添加任务到队列
   */
  public addTask(task: Task): void {
    this.taskQueue.push(task);
    // 按优先级排序
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    console.log(`[TaskExecutor] 任务已添加：${task.description} (优先级：${task.priority})`);
  }

  /**
   * 执行下一个任务
   */
  public async executeNextTask(agentId: string): Promise<TaskResult | null> {
    if (this.taskQueue.length === 0) {
      return null;
    }

    if (this.isExecuting) {
      return null;
    }

    this.isExecuting = true;
    const task = this.taskQueue.shift()!;
    const startTime = Date.now();

    console.log(`[TaskExecutor] 执行任务：${task.description}`);

    let result: TaskResult;

    try {
      switch (task.type) {
        case 'api_call':
          result = await this.executeApiCall(task, agentId);
          break;
        case 'file_read':
          result = await this.executeFileRead(task, agentId);
          break;
        case 'file_write':
          result = await this.executeFileWrite(task, agentId);
          break;
        case 'file_delete':
          result = await this.executeFileDelete(task, agentId);
          break;
        case 'custom':
          result = await this.executeCustom(task, agentId);
          break;
        default:
          throw new Error(`未知任务类型：${task.type}`);
      }

      // 记录观察
      this.recordObservation(agentId, task.type, result);

    } catch (error: any) {
      result = {
        taskId: task.id,
        success: false,
        error: error.message,
        cost: 0,
        duration: Date.now() - startTime
      };
    }

    this.isExecuting = false;
    return result;
  }

  /**
   * 执行 API 调用
   */
  private async executeApiCall(task: Task, agentId: string): Promise<TaskResult> {
    const cost = this.config.get('apiCallCost');
    const { url, method = 'GET', headers = {}, body = null } = task.parameters;

    const startTime = Date.now();
    
    try {
      // 简单的 fetch 实现（实际项目中应使用 node-fetch）
      const response = await fetch(url, {
        method,
        headers: headers as Record<string, string>,
        body: body ? JSON.stringify(body) : null
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        success: response.ok,
        data,
        cost,
        duration
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        success: false,
        error: error.message,
        cost,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行文件读取
   */
  private async executeFileRead(task: Task, agentId: string): Promise<TaskResult> {
    const cost = this.config.get('fileOperationCost');
    const { filePath, encoding = 'utf-8' } = task.parameters;

    const startTime = Date.now();

    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`文件不存在：${fullPath}`);
      }

      const content = fs.readFileSync(fullPath, encoding as BufferEncoding);
      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        data: { content, path: fullPath, size: content.length },
        cost,
        duration
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        success: false,
        error: error.message,
        cost,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行文件写入
   */
  private async executeFileWrite(task: Task, agentId: string): Promise<TaskResult> {
    const cost = this.config.get('fileOperationCost');
    const { filePath, content, encoding = 'utf-8', createDir = true } = task.parameters;

    const startTime = Date.now();

    try {
      const fullPath = path.resolve(filePath);
      const dir = path.dirname(fullPath);

      if (createDir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, encoding as BufferEncoding);
      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        data: { path: fullPath, size: content.length },
        cost,
        duration
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        success: false,
        error: error.message,
        cost,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行文件删除
   */
  private async executeFileDelete(task: Task, agentId: string): Promise<TaskResult> {
    const cost = this.config.get('fileOperationCost');
    const { filePath, recursive = false } = task.parameters;

    const startTime = Date.now();

    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`文件/目录不存在：${fullPath}`);
      }

      if (recursive && fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }

      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        data: { path: fullPath, deleted: true },
        cost,
        duration
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        success: false,
        error: error.message,
        cost,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行自定义任务
   */
  private async executeCustom(task: Task, agentId: string): Promise<TaskResult> {
    const { handler } = task.parameters;
    
    if (typeof handler !== 'function') {
      throw new Error('自定义任务需要提供 handler 函数');
    }

    const startTime = Date.now();
    const data = await handler(task.parameters);
    const duration = Date.now() - startTime;

    return {
      taskId: task.id,
      success: true,
      data,
      cost: 5, // 自定义任务默认成本
      duration
    };
  }

  /**
   * 记录观察结果
   */
  private recordObservation(agentId: string, type: string, result: TaskResult): void {
    this.stateManager.recordObservation(
      agentId,
      type,
      { taskId: result.taskId, success: result.success, duration: result.duration },
      result.success,
      result.error
    );
  }

  /**
   * 获取队列长度
   */
  public getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * 清空队列
   */
  public clearQueue(): void {
    this.taskQueue = [];
    console.log('[TaskExecutor] 任务队列已清空');
  }
}
