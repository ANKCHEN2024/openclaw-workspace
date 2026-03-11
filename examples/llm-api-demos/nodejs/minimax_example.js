/**
 * MiniMax (海螺 AI) API 调用示例 - Node.js
 * 文档：https://platform.minimaxi.com/docs/guides/chat
 */

// 从环境变量获取 API Key
const API_KEY = process.env.MINIMAX_API_KEY || 'your-api-key-here';
const GROUP_ID = process.env.MINIMAX_GROUP_ID || 'your-group-id-here';
const BASE_URL = 'https://api.minimaxi.chat/v1/text/chatcompletion_v2';

/**
 * 调用 MiniMax API
 * @param {Array} messages - 对话消息列表
 * @param {string} model - 模型名称 (abab6.5, abab6.5s, abab6.5t)
 * @param {number} temperature - 温度参数 (0-2)
 * @returns {Promise<Object>} API 响应内容
 */
async function callMiniMax(messages, model = 'abab6.5s', temperature = 0.7) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: 2048,
            group_id: GROUP_ID
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP 错误：${response.status}`);
    }

    return await response.json();
}

async function testTextGeneration() {
    console.log('='.repeat(60));
    console.log('测试 1: 文本生成能力');
    console.log('='.repeat(60));

    const messages = [
        { role: 'user', content: '请用 100 字介绍人工智能的发展趋势' }
    ];

    const result = await callMiniMax(messages, 'abab6.5s');
    const content = result.choices[0].message.content;

    console.log(`响应：${content}`);
    console.log(`Token 使用：输入${result.usage.prompt_tokens}, 输出${result.usage.completion_tokens}`);
    console.log();
}

async function testConversation() {
    console.log('='.repeat(60));
    console.log('测试 2: 多轮对话能力');
    console.log('='.repeat(60));

    const messages = [
        { role: 'system', content: '你是一个有帮助的助手' },
        { role: 'user', content: '你好，我想学习 Python' },
        { role: 'assistant', content: '太好了！Python 是一门非常友好的编程语言。你想从哪些方面开始学习呢？' },
        { role: 'user', content: '推荐一个适合初学者的项目' }
    ];

    const result = await callMiniMax(messages, 'abab6.5s');
    const content = result.choices[0].message.content;

    console.log(`响应：${content}`);
    console.log();
}

async function testCodeGeneration() {
    console.log('='.repeat(60));
    console.log('测试 3: 代码生成能力');
    console.log('='.repeat(60));

    const messages = [
        { role: 'user', content: '用 Python 写一个快速排序函数，包含详细注释' }
    ];

    const result = await callMiniMax(messages, 'abab6.5s');
    const content = result.choices[0].message.content;

    console.log(`生成的代码:\n${content}`);
    console.log();
}

async function main() {
    console.log('\n🚀 MiniMax API 调用示例 (Node.js)\n');

    try {
        await testTextGeneration();
        await testConversation();
        await testCodeGeneration();
        console.log('✅ 所有测试完成!');
    } catch (error) {
        console.error(`❌ 错误：${error.message}`);
        console.log('请确保设置了 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID 环境变量');
    }
}

main();
