#!/usr/bin/env node
/**
 * MOSS 知识图谱提取器
 * 从 LanceDB 向量化知识中提取实体和关系，生成知识图谱数据
 */

import lancedb from '@lancedb/lancedb';
import fs from 'fs/promises';
import path from 'path';

const WORKSPACE = '/Users/chenggl/workspace';
const LANCEDB_PATH = path.join(WORKSPACE, 'lancedb');
const OUTPUT_PATH = path.join(WORKSPACE, 'lancedb', 'knowledge-graph.json');

// 实体类型定义
const ENTITY_TYPES = {
  PERSON: 'Person',
  PROJECT: 'Project',
  SKILL: 'Skill',
  DECISION: 'Decision',
  CONCEPT: 'Concept',
  EVENT: 'Event'
};

// 关系类型定义
const RELATION_TYPES = {
  WORKS_ON: 'WORKS_ON',        // 人物 - 项目
  REQUIRES: 'REQUIRES',        // 项目 - 技能
  LEARNED: 'LEARNED',          // 人物 - 技能
  RELATED_TO: 'RELATED_TO',    // 概念 - 概念
  CAUSED_BY: 'CAUSED_BY',      // 事件 - 决策
  CREATED: 'CREATED',          // 人物 - 概念/项目
  CONTAINS: 'CONTAINS',        // 项目 - 概念
  IMPROVES: 'IMPROVES',        // 技能 - 技能
  BLOCKS: 'BLOCKS',            // 概念 - 项目
  ENABLES: 'ENABLES'           // 技能 - 项目
};

// 关键词映射（用于实体识别）
const ENTITY_KEYWORDS = {
  [ENTITY_TYPES.PERSON]: ['磊哥', '程广磊', '老板', 'MOSS', '我', '你', '用户', '创始人', '总经理'],
  [ENTITY_TYPES.PROJECT]: ['Dashboard', '项目', '平台', '系统', '短剧', '视频', 'AI', '数字孪生', '谷风科技', 'Tech'],
  [ENTITY_TYPES.SKILL]: ['技能', '能力', '技术', '工具', '框架', '库', 'SDK', 'API', 'lancedb', 'tailwind', 'vue', 'nodejs'],
  [ENTITY_TYPES.DECISION]: ['决策', '决定', '选择', '方案', '策略', '规划', '计划'],
  [ENTITY_TYPES.CONCEPT]: ['概念', '理念', '思想', '方法', '模式', '架构', '设计', '原则', '规范'],
  [ENTITY_TYPES.EVENT]: ['事件', '完成', '发布', '上线', '会议', '讨论', '学习', '培训']
};

// 从文本中提取实体
function extractEntities(text, source) {
  const entities = [];
  
  // 简单的人名识别
  if (text.includes('磊哥') || text.includes('程广磊') || text.includes('老板')) {
    entities.push({
      id: `person_chengguanglei`,
      name: '程广磊（磊哥）',
      type: ENTITY_TYPES.PERSON,
      source,
      mentions: 1
    });
  }
  
  if (text.includes('MOSS')) {
    entities.push({
      id: `person_moss`,
      name: 'MOSS',
      type: ENTITY_TYPES.PERSON,
      source,
      mentions: 1
    });
  }
  
  // 项目识别 - 扩展模式
  const projectPatterns = [
    { pattern: /Dashboard\s*v?(\d+\.\d+)?/gi, name: 'Dashboard' },
    { pattern: /AI 短剧平台/gi, name: 'AI 短剧平台' },
    { pattern: /短视频平台/gi, name: '短视频平台' },
    { pattern: /数字孪生/gi, name: '数字孪生系统' },
    { pattern: /谷风科技/gi, name: '谷风科技' },
    { pattern: /知识图谱/gi, name: '知识图谱' },
    { pattern: /L[123]\s*课程/gi, name: 'L1 课程' },
    { pattern: /Phase\s*\d+/gi, name: 'Phase 开发阶段' },
    { pattern: /记忆系统/gi, name: '记忆系统' },
    { pattern: /技能系统/gi, name: '技能系统' },
    { pattern: /自动化脚本/gi, name: '自动化脚本' },
    { pattern: /cron/gi, name: 'Cron 定时任务' },
    { pattern: /Feishu/gi, name: '飞书集成' },
    { pattern: /1Password/gi, name: '1Password 凭证管理' }
  ];
  
  projectPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(text)) {
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      entities.push({
        id: `project_${id}`,
        name,
        type: ENTITY_TYPES.PROJECT,
        source,
        mentions: 1
      });
    }
  });
  
  // 技能识别 - 扩展列表
  const skillPatterns = [
    'LanceDB', 'TailwindCSS', 'Vue.js', 'Node.js', 'JavaScript',
    'Subagent', 'OpenClaw', 'Feishu', '1Password', 'GitHub',
    '向量数据库', '语义搜索', 'RAG', '嵌入', '向量化',
    'UI 设计', '前端开发', '自动化', '脚本编写', 'cron',
    'D3.js', 'Vis.js', 'HTML', 'CSS', 'TypeScript',
    'Webpack', 'Vite', 'ESLint', 'Prettier', 'Git',
    'REST API', 'GraphQL', 'WebSocket', 'HTTP', 'JSON',
    'Docker', 'Kubernetes', 'Linux', 'Shell', 'Bash',
    'Python', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL',
    'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ',
    'AWS', 'Azure', 'GCP', '云服务', 'Serverless',
    'CI/CD', 'DevOps', '敏捷开发', 'Scrum', 'Kanban',
    '测试驱动', '单元测试', '集成测试', 'E2E 测试',
    '性能优化', '安全加固', '代码审查', '重构',
    '机器学习', '深度学习', '神经网络', 'NLP', 'CV',
    'Prompt 工程', 'AI 调优', '模型训练', '数据标注'
  ];
  
  skillPatterns.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(text)) {
      const id = skill.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      entities.push({
        id: `skill_${id}`,
        name: skill,
        type: ENTITY_TYPES.SKILL,
        source,
        mentions: 1
      });
    }
  });
  
  // 概念识别 - 扩展模式
  const conceptPatterns = [
    { pattern: /自主决策/gi, name: '自主决策' },
    { pattern: /ROI 驱动/gi, name: 'ROI 驱动' },
    { pattern: /并行调度/gi, name: '并行调度' },
    { pattern: /进化/gi, name: '持续进化' },
    { pattern: /记忆系统/gi, name: '记忆系统' },
    { pattern: /语义搜索/gi, name: '语义搜索' },
    { pattern: /知识管理/gi, name: '知识管理' },
    { pattern: /数字孪生/gi, name: '数字孪生' },
    { pattern: /生成式 AI/gi, name: '生成式 AI' },
    { pattern: /AIGC/gi, name: 'AIGC' },
    { pattern: /多模态/gi, name: '多模态融合' },
    { pattern: /自然语言处理/gi, name: '自然语言处理' },
    { pattern: /用户体验/gi, name: '用户体验' },
    { pattern: /产品思维/gi, name: '产品思维' },
    { pattern: /用户导向/gi, name: '用户导向' },
    { pattern: /数据驱动/gi, name: '数据驱动' },
    { pattern: /敏捷迭代/gi, name: '敏捷迭代' },
    { pattern: /快速原型/gi, name: '快速原型' },
    { pattern: /最小可行产品/gi, name: 'MVP' },
    { pattern: /增长黑客/gi, name: '增长黑客' }
  ];
  
  conceptPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(text)) {
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      entities.push({
        id: `concept_${id}`,
        name,
        type: ENTITY_TYPES.CONCEPT,
        source,
        mentions: 1
      });
    }
  });
  
  // 事件识别 - 基于关键词
  const eventKeywords = [
    { pattern: /完成/gi, name: '完成事件' },
    { pattern: /发布/gi, name: '发布事件' },
    { pattern: /上线/gi, name: '上线事件' },
    { pattern: /学习/gi, name: '学习活动' },
    { pattern: /培训/gi, name: '培训活动' },
    { pattern: /会议/gi, name: '会议' },
    { pattern: /讨论/gi, name: '讨论' },
    { pattern: /决策/gi, name: '决策事件' },
    { pattern: /启动/gi, name: '项目启动' },
    { pattern: /规划/gi, name: '规划会议' },
    { pattern: /回顾/gi, name: '回顾会议' },
    { pattern: /总结/gi, name: '总结' }
  ];
  
  eventKeywords.forEach(({ pattern, name }) => {
    if (pattern.test(text)) {
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      entities.push({
        id: `event_${id}`,
        name,
        type: ENTITY_TYPES.EVENT,
        source,
        mentions: 1
      });
    }
  });
  
  // 决策识别
  const decisionKeywords = [
    { pattern: /决定/gi, name: '决策' },
    { pattern: /选择/gi, name: '选择' },
    { pattern: /方案/gi, name: '方案确定' },
    { pattern: /策略/gi, name: '策略制定' },
    { pattern: /All in/gi, name: '战略投入' },
    { pattern: /优先/gi, name: '优先级决策' }
  ];
  
  decisionKeywords.forEach(({ pattern, name }) => {
    if (pattern.test(text)) {
      const id = `decision_${name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      entities.push({
        id: `decision_${id}`,
        name,
        type: ENTITY_TYPES.DECISION,
        source,
        mentions: 1
      });
    }
  });
  
  return entities;
}

// 从文本中提取关系
function extractRelations(entities, text, source) {
  const relations = [];
  
  // 根据实体类型推断关系
  const persons = entities.filter(e => e.type === ENTITY_TYPES.PERSON);
  const projects = entities.filter(e => e.type === ENTITY_TYPES.PROJECT);
  const skills = entities.filter(e => e.type === ENTITY_TYPES.SKILL);
  const concepts = entities.filter(e => e.type === ENTITY_TYPES.CONCEPT);
  const events = entities.filter(e => e.type === ENTITY_TYPES.EVENT);
  
  // 人物 - 项目关系
  persons.forEach(person => {
    projects.forEach(project => {
      if (text.includes('完成') || text.includes('开发') || text.includes('创建')) {
        relations.push({
          id: `rel_${person.id}_${project.id}_works_on`,
          source: person.id,
          target: project.id,
          type: RELATION_TYPES.WORKS_ON,
          source,
          confidence: 0.8
        });
      }
    });
    
    // 人物 - 技能关系
    skills.forEach(skill => {
      if (text.includes('学习') || text.includes('掌握') || text.includes('使用')) {
        relations.push({
          id: `rel_${person.id}_${skill.id}_learned`,
          source: person.id,
          target: skill.id,
          type: RELATION_TYPES.LEARNED,
          source,
          confidence: 0.7
        });
      }
    });
  });
  
  // 项目 - 技能关系
  projects.forEach(project => {
    skills.forEach(skill => {
      if (text.includes('需要') || text.includes('使用') || text.includes('基于')) {
        relations.push({
          id: `rel_${project.id}_${skill.id}_requires`,
          source: project.id,
          target: skill.id,
          type: RELATION_TYPES.REQUIRES,
          source,
          confidence: 0.7
        });
      }
    });
  });
  
  // 概念 - 概念关系
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      relations.push({
        id: `rel_${concepts[i].id}_${concepts[j].id}_related`,
        source: concepts[i].id,
        target: concepts[j].id,
        type: RELATION_TYPES.RELATED_TO,
        source,
        confidence: 0.5
      });
    }
  }
  
  // 事件 - 决策关系
  events.forEach(event => {
    projects.forEach(project => {
      relations.push({
        id: `rel_${event.id}_${project.id}_caused_by`,
        source: event.id,
        target: project.id,
        type: RELATION_TYPES.CAUSED_BY,
        source,
        confidence: 0.6
      });
    });
  });
  
  return relations;
}

// 从 LanceDB 表读取数据
async function readLanceTable(db, tableName) {
  try {
    const table = await db.openTable(tableName);
    // 使用 toArrow() 获取所有数据
    const results = await table.toArrow();
    return results.toArray();
  } catch (error) {
    console.error(`❌ 读取表 ${tableName} 失败:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 MOSS 知识图谱提取器启动');
  console.log('=====================================\n');
  
  // 连接 LanceDB
  const db = await lancedb.connect(LANCEDB_PATH);
  console.log('✅ 数据库连接成功:', LANCEDB_PATH);
  
  // 所有表名
  const tableNames = [
    'conversation_history',
    'daily_logs',
    'learning_notes',
    'long_term_memory',
    'project_docs',
    'skills_kb'
  ];
  
  const allEntities = new Map();
  const allRelations = new Map();
  
  // 遍历所有表
  for (const tableName of tableNames) {
    console.log(`\n📊 处理表：${tableName}...`);
    const records = await readLanceTable(db, tableName);
    console.log(`   读取 ${records.length} 条记录`);
    
    for (const record of records) {
      const text = record.text || record.content || 'unknown';
      const source = `${tableName}:${record.id || 'unknown'}`;
      
      // 提取实体
      const entities = extractEntities(text, source);
      entities.forEach(entity => {
        if (allEntities.has(entity.id)) {
          allEntities.get(entity.id).mentions++;
        } else {
          allEntities.set(entity.id, entity);
        }
      });
      
      // 提取关系
      const relations = extractRelations(entities, text, source);
      relations.forEach(relation => {
        if (!allRelations.has(relation.id)) {
          allRelations.set(relation.id, relation);
        }
      });
    }
  }
  
  // 去重实体和关系
  const entities = Array.from(allEntities.values());
  const relations = Array.from(allRelations.values());
  
  console.log('\n📊 提取结果:');
  console.log(`   实体数量：${entities.length}`);
  console.log(`   关系数量：${relations.length}`);
  
  // 按类型统计
  const entityStats = {};
  entities.forEach(e => {
    entityStats[e.type] = (entityStats[e.type] || 0) + 1;
  });
  console.log('\n   实体类型分布:');
  Object.entries(entityStats).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });
  
  const relationStats = {};
  relations.forEach(r => {
    relationStats[r.type] = (relationStats[r.type] || 0) + 1;
  });
  console.log('\n   关系类型分布:');
  Object.entries(relationStats).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });
  
  // 生成知识图谱数据
  const knowledgeGraph = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'LanceDB',
      tables: tableNames,
      version: '1.0'
    },
    entities,
    relations
  };
  
  // 保存结果（处理 BigInt）
  const jsonStr = JSON.stringify(knowledgeGraph, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2);
  await fs.writeFile(OUTPUT_PATH, jsonStr, 'utf-8');
  console.log(`\n✅ 知识图谱数据已保存：${OUTPUT_PATH}`);
  
  // 验证成功标准
  console.log('\n✅ 成功标准检查:');
  console.log(`   ${entities.length >= 100 ? '✅' : '❌'} 实体数量 >= 100: ${entities.length}`);
  console.log(`   ${relations.length >= 200 ? '✅' : '❌'} 关系数量 >= 200: ${relations.length}`);
  
  return knowledgeGraph;
}

main().catch(console.error);
