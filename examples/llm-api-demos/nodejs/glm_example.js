/**
 * GLM (智谱 AI) API 调用示例 - Node.js
 * 文档：https://open.bigmodel.cn/dev/api
 */

const crypto = require('crypto');

// 从环境变量获取 API Key
const API_KEY = process.env.ZHIPU_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * 生成智谱 AI 的访问令牌（需要签名）
 * @param {string} apiKey - API Key 格式为 "id.secret"
 * @param {number} expirationSeconds - 令牌过期时间（秒）
 * @returns {string} 访问令牌
 */
function generateToken(apiKey, expirationSeconds = 3600) {
    const [id, secret] = apiKey.split('.');
    const timestamp = Date.now();
    const exp = timestamp + expirationSeconds * 1000;

    // 构建 payload
    const payload = {
        api_key: id,
        exp: exp,
        timestamp: timestamp
    };

    // 生成签名
    const payloadStr = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadStr)
        .digest('hex');

    return `${payloadStr}.${signature}`;
}

/**
 * 调用 GLM API
 * @param {Array} messages - 对话消息列表
 * @param {string} model - 模型名称 (glm-4, glm-4-air, glm-4-airx, glm-4-flash)
 * @param {number} temperature - 温度参数 (0-2)
 * @returns {Promise<Object>} API 响应内容
 */
async function callGLM(messages, model = 'glm-4', temperature = 0.7) {
    // 生成访问令牌
    const token = generateToken(API_KEY);

    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
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

    const result = await callGLM(messages, 'glm-4');
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

    const result = await callGLM(messages, 'glm-4');
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

    const result = await callGLM(messages, 'glm-4');
    const content = result.choices[0].message.content;

    console.log(`生成的代码:\n${content}`);
    console.log();
}

async function main() {
    console.log('\n🚀 GLM API 调用示例 (Node.js)\n');

    try {
        await testTextGeneration();
        await testConversation();
        await testCodeGeneration();
        console.log('✅ 所有测试完成!');
    } catch (error) {
        console.error(`❌ 错误：${error.message}`);
        console.log('请确保设置了 ZHIPU_API_KEY 环境变量（格式：id.secret）');
    }
}

main();
