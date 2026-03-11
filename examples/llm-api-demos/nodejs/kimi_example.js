/**
 * Kimi (月之暗面) API 调用示例 - Node.js
 * 文档：https://platform.moonshot.cn/docs/api/chat
 */

// 从环境变量获取 API Key
const API_KEY = process.env.MOONSHOT_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://api.moonshot.cn/v1/chat/completions';

/**
 * 调用 Kimi API
 * @param {Array} messages - 对话消息列表
 * @param {string} model - 模型名称 (moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k)
 * @param {number} temperature - 温度参数 (0-2)
 * @returns {Promise<Object>} API 响应内容
 */
async function callKimi(messages, model = 'moonshot-v1-8k', temperature = 0.7) {
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
            max_tokens: 2048
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

    const result = await callKimi(messages, 'moonshot-v1-8k');
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

    const result = await callKimi(messages, 'moonshot-v1-8k');
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

    const result = await callKimi(messages, 'moonshot-v1-8k');
    const content = result.choices[0].message.content;

    console.log(`生成的代码:\n${content}`);
    console.log();
}

async function testLongContext() {
    console.log('='.repeat(60));
    console.log('测试 4: 长文本处理能力（Kimi 优势）');
    console.log('='.repeat(60));

    // 生成一个长文本
    const longText = '这是一篇测试文章。'.repeat(1000);
    const messages = [
        { role: 'user', content: `请总结以下内容：\n\n${longText}` }
    ];

    const result = await callKimi(messages, 'moonshot-v1-32k');
    const content = result.choices[0].message.content;

    console.log(`总结：${content}`);
    console.log(`Token 使用：输入${result.usage.prompt_tokens}, 输出${result.usage.completion_tokens}`);
    console.log();
}

async function main() {
    console.log('\n🚀 Kimi API 调用示例 (Node.js)\n');

    try {
        await testTextGeneration();
        await testConversation();
        await testCodeGeneration();
        await testLongContext();
        console.log('✅ 所有测试完成!');
    } catch (error) {
        console.error(`❌ 错误：${error.message}`);
        console.log('请确保设置了 MOONSHOT_API_KEY 环境变量');
    }
}

main();
