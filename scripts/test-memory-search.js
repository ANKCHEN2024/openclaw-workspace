#!/usr/bin/env node
/**
 * 记忆搜索测试脚本
 * 测试 LanceDB 语义搜索功能
 */

const lancedb = require('@lancedb/lancedb');
const { pipeline } = require('@xenova/transformers');

// 配置
const CONFIG = {
  lancedbPath: '/Users/chenggl/workspace/lancedb',
  embeddingModel: 'Xenova/all-MiniLM-L6-v2'
};

let embedder = null;

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

async function search(query, tableName = null, limit = 5) {
  const db = await lancedb.connect(CONFIG.lancedbPath);
  const embedding = await embedText(query);
  
  const tables = tableName ? [tableName] : [
    'long_term_memory',
    'daily_logs',
    'project_docs',
    'skills_kb'
  ];
  
  const allResults = [];
  
  for (const table of tables) {
    try {
      const tbl = await db.openTable(table);
      const results = await tbl
        .search(embedding)
        .limit(limit)
        .execute();
      
      // 迭代 AsyncGenerator (Arrow RecordBatch)
      for await (const batch of results) {
        for (let i = 0; i < batch.numRows; i++) {
          const row = batch.get(i);
          const content = row.content?.toString() || '';
          const source = row.source?.toString() || 'unknown';
          const distance = row._distance ?? 0;
          
          allResults.push({
            table: table,
            content: content,
            source: source,
            score: 1 - distance,
            chunkIndex: row.chunkIndex ?? 0
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ 表 ${table} 搜索失败：${error.message}`);
    }
  }
  
  // 按分数排序
  allResults.sort((a, b) => b.score - a.score);
  return allResults.slice(0, limit);
}

async function runTests() {
  console.log('🧪 开始记忆搜索测试...\n');
  
  // 初始化嵌入模型
  await getEmbedder();
  console.log('✅ 嵌入模型就绪\n');
  
  const testQueries = [
    {
      query: 'Subagent 协调和任务分配',
      description: '测试 Subagent 相关记忆'
    },
    {
      query: 'Cron 定时任务配置',
      description: '测试定时任务配置记忆'
    },
    {
      query: '数字孪生和 AI 大脑',
      description: '测试业务方向记忆'
    },
    {
      query: '技能系统自动化',
      description: '测试技能开发记忆'
    },
    {
      query: '磊哥的教育背景',
      description: '测试用户信息记忆'
    }
  ];
  
  const results = [];
  
  for (const test of testQueries) {
    console.log(`\n🔍 测试：${test.description}`);
    console.log(`   查询："${test.query}"`);
    
    const searchResults = await search(test.query);
    
    if (searchResults.length === 0) {
      console.log('   ❌ 未找到相关结果');
      results.push({ test, found: 0 });
    } else {
      console.log(`   ✅ 找到 ${searchResults.length} 个相关结果`);
      
      for (let i = 0; i < Math.min(2, searchResults.length); i++) {
        const result = searchResults[i];
        const preview = result.content.substring(0, 100).replace(/\n/g, ' ') + '...';
        console.log(`     [${(result.score * 100).toFixed(1)}%] ${result.source}: ${preview}`);
      }
      
      results.push({ test, found: searchResults.length, topScore: searchResults[0].score });
    }
  }
  
  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log(`  总测试数：${results.length}`);
  console.log(`  成功：${results.filter(r => r.found > 0).length}`);
  console.log(`  失败：${results.filter(r => r.found === 0).length}`);
  
  if (results.some(r => r.topScore && r.topScore >= 0.3)) {
    console.log(`  最高分数：${(Math.max(...results.map(r => r.topScore || 0)) * 100).toFixed(1)}%`);
  }
  
  console.log('='.repeat(60));
  
  return results;
}

// 运行测试
runTests()
  .then(results => {
    const success = results.filter(r => r.found > 0).length;
    const total = results.length;
    
    if (success === total) {
      console.log('\n✅ 所有测试通过！\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️ ${success}/${total} 测试通过\n`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
