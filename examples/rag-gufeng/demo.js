/**
 * 谷风科技 RAG 知识库 Demo
 * 
 * 功能：
 * - 加载项目案例、技术方案、报价数据
 * - 实现简单关键词检索（无需 API）
 * - 演示 RAG 系统核心流程
 * 
 * 用法：
 *   node demo.js                    # 交互式查询
 *   node demo.js "智慧园区多少钱"    # 命令行查询
 */

const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SOLUTIONS_FILE = path.join(DATA_DIR, 'solutions.json');
const PRICING_FILE = path.join(DATA_DIR, 'pricing.json');

// 加载数据
function loadData() {
  console.log('📚 加载知识库数据...');
  
  const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')).projects;
  const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_FILE, 'utf-8')).solutions;
  const pricing = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf-8')).pricing;
  
  console.log(`✓ 项目案例：${projects.length} 个`);
  console.log(`✓ 技术方案：${solutions.length} 个`);
  console.log(`✓ 报价数据：${pricing.length} 类`);
  console.log('');
  
  return { projects, solutions, pricing };
}

// 简单关键词检索（演示用，实际应使用向量检索）
function keywordSearch(query, items, options = {}) {
  const queryTerms = query.toLowerCase().split(/[\s,]+/).filter(t => t.length > 1);
  
  const scored = items.map(item => {
    let score = 0;
    const itemName = item.name || item.project_type || '';
    const searchText = (
      itemName + ' ' + 
      (item.description || '') + ' ' + 
      (item.content || '') + ' ' + 
      (item.category || '') + ' ' +
      (item.project_type || '') + ' ' +
      (item.scope || '') + ' ' +
      (item.tech_stack || []).join(' ')
    ).toLowerCase();
    
    // 关键词匹配
    queryTerms.forEach(term => {
      if (searchText.includes(term)) {
        score += 2;
      }
      // 标题匹配加分
      if (itemName.toLowerCase().includes(term)) {
        score += 3;
      }
      // 部分匹配（2 个字符以上）
      if (term.length >= 2 && searchText.includes(term)) {
        score += 1;
      }
    });
    
    return { ...item, score };
  });
  
  // 排序并返回 top-k
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.topK || 5);
}

// 智能路由查询
function routeQuery(query, data) {
  const queryLower = query.toLowerCase();
  
  // 判断查询类型
  if (queryLower.includes('钱') || queryLower.includes('价格') || queryLower.includes('报价') || queryLower.includes('预算')) {
    return { type: 'pricing', data: data.pricing };
  } else if (queryLower.includes('技术') || queryLower.includes('方案') || queryLower.includes('架构')) {
    return { type: 'solution', data: data.solutions };
  } else if (queryLower.includes('项目') || queryLower.includes('案例') || queryLower.includes('客户')) {
    return { type: 'project', data: data.projects };
  } else {
    // 默认搜索全部
    return { type: 'all', data: null };
  }
}

// 生成回答
function generateAnswer(query, results, type) {
  if (results.length === 0) {
    return {
      answer: '抱歉，知识库中没有找到相关信息。您可以尝试：\n1. 换一种问法\n2. 使用更具体的关键词\n3. 联系技术支持',
      confidence: 0,
      sources: []
    };
  }
  
  let answer = '';
  const sources = [];
  
  if (type === 'pricing') {
    // 报价类回答
    const avgPrices = results.map(r => ({
      type: r.project_type,
      avg: r.avg_price,
      range: `${(r.min_price/10000).toFixed(0)}-${(r.max_price/10000).toFixed(0)}万`
    }));
    
    answer = `根据谷风科技历史项目数据：\n\n`;
    results.forEach((r, i) => {
      answer += `**${r.project_type}**：¥${(r.min_price/10000).toFixed(0)}-${(r.max_price/10000).toFixed(0)}万\n`;
      answer += `  平均报价：¥${(r.avg_price/10000).toFixed(0)}万\n`;
      answer += `  影响因素：${r.factors.join('、')}\n\n`;
      sources.push({ id: r.id, name: r.project_type, relevance: 0.9 - i * 0.1 });
    });
    
    answer += `💡 提示：具体报价需根据项目规模、定制化程度、交付周期等因素评估。`;
    
  } else if (type === 'project') {
    // 项目案例回答
    answer = `谷风科技相关项目案例：\n\n`;
    results.forEach((r, i) => {
      answer += `**${r.name}** (${r.id})\n`;
      answer += `  类型：${r.category}\n`;
      answer += `  预算：¥${(r.budget/10000).toFixed(0)}万\n`;
      answer += `  状态：${r.status}\n`;
      answer += `  亮点：${r.highlights.join('、')}\n`;
      answer += `  简介：${r.description}\n\n`;
      sources.push({ id: r.id, name: r.name, relevance: 0.9 - i * 0.1 });
    });
    
  } else if (type === 'solution') {
    // 技术方案回答
    answer = `相关技术方案：\n\n`;
    results.forEach((r, i) => {
      answer += `**${r.name}** (${r.id})\n`;
      answer += `  领域：${r.domain}\n`;
      answer += `  架构：${r.architecture}\n`;
      answer += `  核心组件：${r.components.join('、')}\n`;
      answer += `  优势：${r.pros_cons.pros.join('、')}\n`;
      answer += `  劣势：${r.pros_cons.cons.join('、')}\n\n`;
      sources.push({ id: r.id, name: r.name, relevance: 0.9 - i * 0.1 });
    });
    
  } else {
    // 通用回答
    answer = `搜索结果：\n\n`;
    results.forEach((r, i) => {
      answer += `**${r.name || r.project_type}** (${r.id})\n`;
      answer += `  ${r.description || r.content?.substring(0, 100) + '...'}\n\n`;
      sources.push({ id: r.id, name: r.name || r.project_type, relevance: 0.8 - i * 0.1 });
    });
  }
  
  return {
    answer,
    confidence: results.length > 0 ? 0.85 : 0,
    sources
  };
}

// 主查询函数
function query(query, data) {
  console.log(`\n🔍 查询："${query}"`);
  console.log('─'.repeat(50));
  
  // 路由查询类型
  const route = routeQuery(query, data);
  console.log(`查询类型：${route.type}`);
  
  // 执行检索
  let results;
  if (route.type === 'all') {
    // 搜索全部
    const allItems = [...data.projects, ...data.solutions, ...data.pricing];
    results = keywordSearch(query, allItems, { topK: 5 });
  } else {
    results = keywordSearch(query, route.data, { topK: 5 });
  }
  
  console.log(`检索结果：${results.length} 条`);
  
  // 生成回答
  const response = generateAnswer(query, results, route.type);
  
  // 输出结果
  console.log('\n📝 回答：');
  console.log(response.answer);
  
  console.log('\n📊 置信度：' + (response.confidence * 100).toFixed(0) + '%');
  
  if (response.sources.length > 0) {
    console.log('\n📚 信息来源：');
    response.sources.forEach((s, i) => {
      console.log(`  [${i+1}] ${s.id}: ${s.name} (相关度：${(s.relevance * 100).toFixed(0)}%)`);
    });
  }
  
  return response;
}

// 交互式查询
function interactiveMode(data) {
  console.log('\n🎯 谷风科技 RAG 知识库 Demo');
  console.log('─'.repeat(50));
  console.log('示例问题：');
  console.log('  - 智慧园区项目多少钱？');
  console.log('  - 谷风科技有哪些项目案例？');
  console.log('  - 数字孪生用什么技术栈？');
  console.log('  - AI 短剧平台进度如何？');
  console.log('\n输入 "quit" 退出\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function ask() {
    readline.question('❓ 请输入问题：', (input) => {
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log('\n👋 再见！');
        readline.close();
        return;
      }
      
      if (input.trim()) {
        query(input, data);
      }
      
      console.log('');
      ask();
    });
  }
  
  ask();
}

// 主函数
function main() {
  // 加载数据
  const data = loadData();
  
  // 命令行参数查询
  const args = process.argv.slice(2).join(' ');
  if (args) {
    query(args, data);
    return;
  }
  
  // 交互式查询
  interactiveMode(data);
}

// 运行
main();
