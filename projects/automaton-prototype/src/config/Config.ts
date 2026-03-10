import * as fs from 'fs';
import * as path from 'path';

export interface ConfigData {
  agentName: string;
  initialBalance: number;
  tickIntervalMs: number;
  
  // 生存阈值
  lowComputeThreshold: number;
  criticalThreshold: number;
  deadThreshold: number;
  
  // 成本配置
  thoughtCost: number;
  actionCost: number;
  observationCost: number;
  apiCallCost: number;
  fileOperationCost: number;
  
  // 数据库配置
  dbPath: string;
  
  // 日志配置
  logLevel: string;
}

export class Config {
  private static instance: Config;
  private config: ConfigData;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadConfig(): ConfigData {
    const configPaths = [
      path.join(process.cwd(), 'config', 'default.json'),
      path.join(process.cwd(), 'config.json'),
      path.join(__dirname, '../../config/default.json')
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileContent = fs.readFileSync(configPath, 'utf-8');
          const fileConfig = JSON.parse(fileContent);
          return this.mergeWithEnv(fileConfig);
        } catch (error) {
          console.warn(`读取配置文件失败 ${configPath}:`, error);
        }
      }
    }

    // 返回默认配置
    return this.getDefaultConfig();
  }

  private mergeWithEnv(fileConfig: Partial<ConfigData>): ConfigData {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      agentName: process.env.AGENT_NAME || fileConfig.agentName || defaultConfig.agentName,
      initialBalance: Number(process.env.INITIAL_BALANCE) || fileConfig.initialBalance || defaultConfig.initialBalance,
      tickIntervalMs: Number(process.env.TICK_INTERVAL_MS) || fileConfig.tickIntervalMs || defaultConfig.tickIntervalMs,
      
      lowComputeThreshold: Number(process.env.LOW_COMPUTE_THRESHOLD) || fileConfig.lowComputeThreshold || defaultConfig.lowComputeThreshold,
      criticalThreshold: Number(process.env.CRITICAL_THRESHOLD) || fileConfig.criticalThreshold || defaultConfig.criticalThreshold,
      deadThreshold: Number(process.env.DEAD_THRESHOLD) || fileConfig.deadThreshold || defaultConfig.deadThreshold,
      
      thoughtCost: Number(process.env.THOUGHT_COST) || fileConfig.thoughtCost || defaultConfig.thoughtCost,
      actionCost: Number(process.env.ACTION_COST) || fileConfig.actionCost || defaultConfig.actionCost,
      observationCost: Number(process.env.OBSERVATION_COST) || fileConfig.observationCost || defaultConfig.observationCost,
      apiCallCost: Number(process.env.API_CALL_COST) || fileConfig.apiCallCost || defaultConfig.apiCallCost,
      fileOperationCost: Number(process.env.FILE_OPERATION_COST) || fileConfig.fileOperationCost || defaultConfig.fileOperationCost,
      
      dbPath: process.env.DB_PATH || fileConfig.dbPath || defaultConfig.dbPath,
      logLevel: process.env.LOG_LEVEL || fileConfig.logLevel || defaultConfig.logLevel
    };
  }

  private getDefaultConfig(): ConfigData {
    return {
      agentName: 'MyAutomaton',
      initialBalance: 1000,
      tickIntervalMs: 5000,
      
      lowComputeThreshold: 500,
      criticalThreshold: 100,
      deadThreshold: 0,
      
      thoughtCost: 1,
      actionCost: 5,
      observationCost: 2,
      apiCallCost: 10,
      fileOperationCost: 3,
      
      dbPath: './data/agent_state.db',
      logLevel: 'info'
    };
  }

  public get<T extends keyof ConfigData>(key: T): ConfigData[T] {
    return this.config[key];
  }

  public getAll(): ConfigData {
    return { ...this.config };
  }
}
