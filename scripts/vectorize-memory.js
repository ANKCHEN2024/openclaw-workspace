#!/usr/bin/env node
/**
 * 记忆向量化脚本
 * 将所有记忆文件向量化并存入 LanceDB
 */

const lancedb = require('@lancedb/lancedb');
const fs = require('fs').promises;
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// 配置
const CONFIG = {
  lancedbPath: '/Users/chenggl/workspace/lancedb',
  dbName: 'omni-memory',
  workspacePath: '/Users/chenggl/workspace',
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  tables: {
    longTermMemory: 'long_term_memory',
    dailyLogs: 'daily_logs',
    projectDocs: 'project_docs',
    skillsKb: 'skills_kb',
    learningNotes: 'learning_notes',
    conversationHistory: 'conversation_history'
  }
};

// 嵌入模型实例（懒加载）
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('🔄 加载嵌入模型...');
    embedder = await pipeline('feature-extraction', CONFIG.embeddingModel);
    console.log('✅ 嵌入模型加载完成');
  }
  return embedder;
}

// 生成文本嵌入
async function embedText(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// 分块文本（避免超出嵌入模型限制）
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

// 读取文件内容
async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`⚠️ 无法读取文件 ${filePath}: ${error.message}`);
    return null;
  }
}

// 获取所有记忆文件
async function getMemoryFiles() {
  const memoryDir = path.join(CONFIG.workspacePath, 'memory');
  const files = [];
  
  try {
    const entries = await fs.readdir(memoryDir);
    for (const entry of entries) {
      if (entry.endsWith('.md')) {
        files.push(path.join(memoryDir, entry));
      }
    }
  } catch (error) {
    console.warn(`⚠️ 无法读取 memory 目录：${error.message}`);
  }
  
  return files;
}

// 获取项目文档
async function getProjectDocs() {
  const docs = [];
  const projectsDir = path.join(CONFIG.workspacePath, 'projects');
  
  async function scanDir(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // 跳过 node_modules
        if (entry.name === 'node_modules') continue;
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // 只收集项目文档，跳过 node_modules 中的
          if (!fullPath.includes('/node_modules/')) {
            docs.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 无法扫描目录 ${dir}: ${error.message}`);
    }
  }
  
  await scanDir(projectsDir);
  return docs;
}

// 获取技能文档
async function getSkillsDocs() {
  const docs = [];
  const skillsDir = path.join(CONFIG.workspacePath, 'skills');
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = path.join(skillsDir, entry.name);
        const skillMd = path.join(skillDir, 'SKILL.md');
        const readmeMd = path.join(skillDir, 'README.md');
        
        try {
          await fs.access(skillMd);
          docs.push(skillMd);
        } catch {}
        
        try {
          await fs.access(readmeMd);
          docs.push(readmeMd);
        } catch {}
      }
    }
  } catch (error) {
    console.warn(`⚠️ 无法读取 skills 目录：${error.message}`);
  }
  
  return docs;
}

// 向量化长期记忆
async function vectorizeLongTermMemory(db) {
  console.log('\n📚 处理长期记忆 (MEMORY.md)...');
  
  const memoryPath = path.join(CONFIG.workspacePath, 'MEMORY.md');
  const content = await readFile(memoryPath);
  
  if (!content) {
    console.log('⚠️ MEMORY.md 不存在，跳过');
    return 0;
  }
  
  const table = await db.openTable(CONFIG.tables.longTermMemory);
  const chunks = chunkText(content);
  let count = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embedText(chunk);
    
    await table.add([{
      id: `memory-${i}`,
      content: chunk,
      source: 'MEMORY.md',
      sourcePath: memoryPath,
      chunkIndex: i,
      totalChunks: chunks.length,
      embedding: embedding,
      createdAt: Date.now()
    }]);
    
    count++;
    if (count % 10 === 0) {
      console.log(`  已处理 ${count}/${chunks.length} 个块`);
    }
  }
  
  console.log(`✅ 长期记忆向量化完成：${count} 个块`);
  return count;
}

// 向量化日常日志
async function vectorizeDailyLogs(db) {
  console.log('\n📅 处理日常日志 (memory/*.md)...');
  
  const files = await getMemoryFiles();
  const table = await db.openTable(CONFIG.tables.dailyLogs);
  let totalChunks = 0;
  
  for (const file of files) {
    const content = await readFile(file);
    if (!content) continue;
    
    const fileName = path.basename(file);
    const chunks = chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      
      await table.add([{
        id: `daily-${fileName}-${i}`,
        content: chunk,
        source: fileName,
        sourcePath: file,
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embedding,
        createdAt: Date.now()
      }]);
      
      totalChunks++;
    }
    
    console.log(`  ✓ ${fileName}: ${chunks.length} 个块`);
  }
  
  console.log(`✅ 日常日志向量化完成：${files.length} 个文件，${totalChunks} 个块`);
  return totalChunks;
}

// 向量化项目文档
async function vectorizeProjectDocs(db) {
  console.log('\n📁 处理项目文档...');
  
  const files = await getProjectDocs();
  const table = await db.openTable(CONFIG.tables.projectDocs);
  let totalChunks = 0;
  
  for (const file of files) {
    const content = await readFile(file);
    if (!content) continue;
    
    const relPath = path.relative(CONFIG.workspacePath, file);
    const chunks = chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      
      await table.add([{
        id: `project-${relPath.replace(/\//g, '-')}-${i}`,
        content: chunk,
        source: relPath,
        sourcePath: file,
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embedding,
        createdAt: Date.now()
      }]);
      
      totalChunks++;
    }
    
    console.log(`  ✓ ${relPath}: ${chunks.length} 个块`);
  }
  
  console.log(`✅ 项目文档向量化完成：${files.length} 个文件，${totalChunks} 个块`);
  return totalChunks;
}

// 向量化技能文档
async function vectorizeSkillsKb(db) {
  console.log('\n🛠️ 处理技能知识库...');
  
  const files = await getSkillsDocs();
  const table = await db.openTable(CONFIG.tables.skillsKb);
  let totalChunks = 0;
  
  for (const file of files) {
    const content = await readFile(file);
    if (!content) continue;
    
    const relPath = path.relative(CONFIG.workspacePath, file);
    const chunks = chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      
      await table.add([{
        id: `skill-${relPath.replace(/\//g, '-')}-${i}`,
        content: chunk,
        source: relPath,
        sourcePath: file,
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embedding,
        createdAt: Date.now()
      }]);
      
      totalChunks++;
    }
    
    console.log(`  ✓ ${relPath}: ${chunks.length} 个块`);
  }
  
  console.log(`✅ 技能知识库向量化完成：${files.length} 个文件，${totalChunks} 个块`);
  return totalChunks;
}

// 主函数
async function main() {
  console.log('🚀 开始记忆向量化...\n');
  console.log(`📂 LanceDB 路径：${CONFIG.lancedbPath}`);
  console.log(`📊 数据库名称：${CONFIG.dbName}`);
  
  // 连接 LanceDB
  console.log('\n🔗 连接 LanceDB...');
  const db = await lancedb.connect(CONFIG.lancedbPath);
  console.log('✅ LanceDB 连接成功');
  
  // 创建表（如果不存在）
  const sampleData = [{
    id: '',
    content: '',
    source: '',
    sourcePath: '',
    chunkIndex: 0,
    totalChunks: 0,
    embedding: new Array(384).fill(0),
    createdAt: BigInt(0)
  }];
  
  for (const tableName of Object.values(CONFIG.tables)) {
    try {
      await db.createTable(tableName, sampleData);
      console.log(`✅ 创建表：${tableName}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✓ 表已存在：${tableName}`);
      } else {
        throw error;
      }
    }
  }
  
  // 向量化所有记忆
  const stats = {
    longTermMemory: 0,
    dailyLogs: 0,
    projectDocs: 0,
    skillsKb: 0,
    learningNotes: 0,
    conversationHistory: 0
  };
  
  stats.longTermMemory = await vectorizeLongTermMemory(db);
  stats.dailyLogs = await vectorizeDailyLogs(db);
  stats.projectDocs = await vectorizeProjectDocs(db);
  stats.skillsKb = await vectorizeSkillsKb(db);
  
  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 向量化统计:');
  console.log(`  长期记忆：${stats.longTermMemory} 个块`);
  console.log(`  日常日志：${stats.dailyLogs} 个块`);
  console.log(`  项目文档：${stats.projectDocs} 个块`);
  console.log(`  技能知识：${stats.skillsKb} 个块`);
  console.log(`  总计：${Object.values(stats).reduce((a, b) => a + b, 0)} 个块`);
  console.log('='.repeat(60));
  console.log('✅ 记忆向量化完成！\n');
  
  return stats;
}

// 运行
main()
  .then(stats => {
    console.log('✨ 脚本执行成功');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
