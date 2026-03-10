#!/usr/bin/env node
/**
 * 记忆文件监控脚本
 * 实时监控记忆文件变化，自动向量化新内容
 */

const lancedb = require('@lancedb/lancedb');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// 配置
const CONFIG = {
  lancedbPath: '/Users/chenggl/workspace/lancedb',
  workspacePath: '/Users/chenggl/workspace',
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  watchPaths: [
    '/Users/chenggl/workspace/memory',
    '/Users/chenggl/workspace/MEMORY.md',
    '/Users/chenggl/workspace/projects',
    '/Users/chenggl/workspace/skills'
  ]
};

// 嵌入模型实例
let embedder = null;
let db = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', CONFIG.embeddingModel);
  }
  return embedder;
}

async function embedText(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function chunkText(text, maxLength = 512) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

function determineTable(filePath) {
  const relPath = path.relative(CONFIG.workspacePath, filePath);
  
  if (filePath.endsWith('MEMORY.md')) {
    return 'long_term_memory';
  } else if (relPath.startsWith('memory/')) {
    return 'daily_logs';
  } else if (relPath.startsWith('projects/')) {
    return 'project_docs';
  } else if (relPath.startsWith('skills/')) {
    return 'skills_kb';
  }
  
  return null;
}

async function vectorizeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const tableName = determineTable(filePath);
    
    if (!tableName) {
      console.log(`⚠️ 跳过未知类型文件：${filePath}`);
      return 0;
    }
    
    const table = await db.openTable(tableName);
    const chunks = chunkText(content);
    const relPath = path.relative(CONFIG.workspacePath, filePath);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      
      const id = `${tableName}-${relPath.replace(/\//g, '-')}-${i}-${Date.now()}`;
      
      await table.add([{
        id: id,
        content: chunk,
        source: relPath,
        sourcePath: filePath,
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embedding,
        createdAt: BigInt(Date.now())
      }]);
    }
    
    console.log(`✅ 向量化：${relPath} (${chunks.length} 个块)`);
    return chunks.length;
  } catch (error) {
    console.error(`❌ 向量化失败 ${filePath}: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔍 启动记忆文件监控...\n');
  
  // 连接 LanceDB
  db = await lancedb.connect(CONFIG.lancedbPath);
  console.log('✅ LanceDB 连接成功');
  
  // 初始化嵌入模型
  await getEmbedder();
  console.log('✅ 嵌入模型就绪\n');
  
  // 监控文件
  const watcher = chokidar.watch(CONFIG.watchPaths, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true
  });
  
  watcher
    .on('add', filePath => {
      console.log(`📄 新文件：${path.relative(CONFIG.workspacePath, filePath)}`);
      vectorizeFile(filePath);
    })
    .on('change', filePath => {
      console.log(`📝 文件变更：${path.relative(CONFIG.workspacePath, filePath)}`);
      vectorizeFile(filePath);
    })
    .on('unlink', async filePath => {
      const relPath = path.relative(CONFIG.workspacePath, filePath);
      console.log(`🗑️  文件删除：${relPath}`);
      
      // 从 LanceDB 中删除对应记录
      try {
        const tableName = determineTable(filePath);
        if (tableName) {
          const table = await db.openTable(tableName);
          // 使用文件名作为前缀来删除相关记录
          const filePrefix = relPath.replace(/\//g, '-');
          const query = await table.search('')
            .where(`id LIKE '${tableName}-${filePrefix}-%'`)
            .limit(1000);
          const results = await query.execute();
          
          if (results.length > 0) {
            for (const result of results) {
              await table.delete(`id = '${result.id}'`);
            }
            console.log(`✅ 已从 ${tableName} 删除 ${results.length} 条记录`);
          }
        }
      } catch (error) {
        console.error(`❌ 删除向量记录失败:`, error.message);
      }
    });
  
  console.log('👀 监控中... (按 Ctrl+C 停止)\n');
  
  // 保持进程运行
  process.on('SIGINT', async () => {
    console.log('\n👋 停止监控...');
    await watcher.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});
