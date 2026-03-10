# 🇨🇳 国内 API 配置指南

## 支持的国内 API 提供商

本平台已集成 4 家国内主流视频生成 API，无需翻墙，访问速度快，支持中文提示词。

---

## 1. 阿里云 - 通义万相 ⭐ 推荐

**价格**: 约 ¥0.5/秒  
**时长**: 最长 10 秒  
**特点**: 质量高，速度快，文档完善

### 获取 API 密钥

1. 访问 [阿里云控制台](https://dashscope.console.aliyun.com/)
2. 登录/注册阿里云账号
3. 进入「API-KEY 管理」页面
4. 点击「创建新的 API-KEY」
5. 复制 API 密钥

### 配置方法

**Web 界面**:
- 进入设置页面
- 选择「阿里云 - 通义万相」
- 输入 API 密钥
- 点击保存

**CLI**:
```bash
short-video config
# 选择阿里云，输入 API 密钥
```

**API**:
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "aliyun_api_key": "sk-xxxxxxxxxxxxxxxx"
  }'
```

### 免费额度
- 新用户赠送 100 秒免费时长
- 有效期 30 天

---

## 2. 腾讯云 - 混元大模型

**价格**: 约 ¥0.6/秒  
**时长**: 最长 10 秒  
**特点**: 腾讯生态，稳定可靠

### 获取 API 密钥

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 登录/注册腾讯云账号
3. 搜索「混元大模型」
4. 进入「API 密钥管理」
5. 创建密钥，获取 SecretId 和 SecretKey

### 配置方法

**Web 界面**:
- 进入设置页面
- 选择「腾讯云 - 混元大模型」
- 输入 SecretId 和 SecretKey
- 点击保存

**CLI**:
```bash
short-video config
# 选择腾讯云，输入 SecretId 和 SecretKey
```

**API**:
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "tencent_secret_id": "AKIDxxxxxxxxxxxxxxxx",
    "tencent_secret_key": "xxxxxxxxxxxxxxxx"
  }'
```

### 免费额度
- 新用户赠送 50 秒免费时长
- 有效期 30 天

---

## 3. 火山引擎 - 即梦 AI ⭐ 性价比高

**价格**: 约 ¥0.4/秒  
**时长**: 最长 10 秒  
**特点**: 价格实惠，生成速度快

### 获取 API 密钥

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 登录/注册火山引擎账号
3. 搜索「即梦 AI」
4. 进入「API 密钥管理」
5. 创建 API 密钥

### 配置方法

**Web 界面**:
- 进入设置页面
- 选择「火山引擎 - 即梦 AI」
- 输入 API 密钥
- 点击保存

**CLI**:
```bash
short-video config
# 选择火山引擎，输入 API 密钥
```

**API**:
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "volcengine_api_key": "xxxxxxxxxxxxxxxx"
  }'
```

### 免费额度
- 新用户赠送 200 秒免费时长
- 有效期 30 天

---

## 4. 快手 - 可灵 AI ⭐ 最便宜

**价格**: 约 ¥0.3/秒  
**时长**: 最长 10 秒  
**特点**: 价格最低，适合批量生成

### 获取 API 密钥

1. 访问 [可灵 AI 官网](https://klingai.kuaishou.com/)
2. 登录/注册快手账号
3. 进入「开发者平台」
4. 创建应用，获取 API 密钥

### 配置方法

**Web 界面**:
- 进入设置页面
- 选择「快手 - 可灵 AI」
- 输入 API 密钥
- 点击保存

**CLI**:
```bash
short-video config
# 选择快手可灵，输入 API 密钥
```

**API**:
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "kuaishou_api_key": "xxxxxxxxxxxxxxxx"
  }'
```

### 免费额度
- 新用户赠送 100 秒免费时长
- 有效期 30 天

---

## 💡 使用建议

### 新手推荐
首选 **火山引擎 - 即梦 AI** 或 **阿里云 - 通义万相**
- 免费额度多
- 文档完善
- 生成质量高

### 批量生成
推荐 **快手 - 可灵 AI**
- 价格最便宜
- 适合大量生成

### 高质量需求
推荐 **阿里云 - 通义万相**
- 画质最佳
- 细节丰富

### 性价比
推荐 **火山引擎 - 即梦 AI**
- 价格适中
- 质量不错
- 免费额度最多

---

## 🔧 多账号配置

可以配置多个 API 提供商，系统会自动切换：

```bash
# 配置阿里云
short-video config aliyun

# 配置火山引擎
short-video config volcengine

# 生成时指定提供商
short-video generate "一只柯基在足球场" --provider volcengine
```

---

## 📊 价格对比

| 提供商 | 价格/秒 | 免费额度 | 最长时长 | 推荐指数 |
|--------|---------|----------|----------|----------|
| 阿里云 | ¥0.5 | 100 秒 | 10 秒 | ⭐⭐⭐⭐⭐ |
| 腾讯云 | ¥0.6 | 50 秒 | 10 秒 | ⭐⭐⭐⭐ |
| 火山引擎 | ¥0.4 | 200 秒 | 10 秒 | ⭐⭐⭐⭐⭐ |
| 快手可灵 | ¥0.3 | 100 秒 | 10 秒 | ⭐⭐⭐⭐ |

---

## ❓ 常见问题

### Q: 国内 API 和国际 API 有什么区别？
A: 国内 API 服务器在国内，访问速度快，支持中文提示词更好，价格更便宜。

### Q: 需要备案吗？
A: 个人使用不需要备案，只需注册账号获取 API 密钥即可。

### Q: 可以用支付宝/微信支付吗？
A: 可以，所有国内 API 都支持支付宝和微信支付充值。

### Q: 免费额度用完后怎么办？
A: 可以充值继续使用，或切换到其他有免费额度的提供商。

---

## 📖 官方文档

- [阿里云通义万相](https://help.aliyun.com/zh/dashscope)
- [腾讯云混元大模型](https://cloud.tencent.com/document/product/1729)
- [火山引擎即梦 AI](https://www.volcengine.com/docs/6822)
- [快手可灵 AI](https://klingai.kuaishou.com/docs)

---

开始使用国内 API，享受更快的生成速度和更优惠的价格！🚀
