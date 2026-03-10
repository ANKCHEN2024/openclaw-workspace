/**
 * ============================================
 * 短视频生成平台 - 主应用逻辑
 * ============================================
 */

// API 配置
const API_CONFIG = {
  baseURL: localStorage.getItem('api_base_url') || 'http://localhost:3000/api',
  apiKey: localStorage.getItem('api_key') || ''
};

// ============================================
// 工具函数
// ============================================

/**
 * 显示提示消息
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : ''}
      ${type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : ''}
      ${type === 'warning' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' : ''}
      ${type === 'info' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>' : ''}
    </svg>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 显示/隐藏加载状态
 */
function setLoading(isLoading, message = '加载中...') {
  let overlay = document.querySelector('.loading-overlay');
  
  if (isLoading && !overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <span class="loading-spinner"></span>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else if (!isLoading && overlay) {
    overlay.remove();
  }
}

/**
 * API 请求封装（支持认证）
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = Auth ? Auth.getToken() : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // 优先使用 JWT Token，如果没有则使用 API Key
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (API_CONFIG.apiKey) {
    headers['Authorization'] = `Bearer ${API_CONFIG.apiKey}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Token 过期，清除登录状态
      if (response.status === 401 && Auth) {
        Auth.logout();
      }
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚';
  }
  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于 24 小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于 7 天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 否则显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 格式化时长（秒 -> MM:SS）
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 文件转 Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// 页面初始化
// ============================================

/**
 * 初始化导航栏
 */
function initNavbar() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navbarNav = document.querySelector('.navbar-nav');
  
  if (menuToggle && navbarNav) {
    menuToggle.addEventListener('click', () => {
      navbarNav.classList.toggle('active');
    });
  }
  
  // 设置当前活动链接
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

/**
 * 检查 API 配置
 */
function checkApiConfig() {
  if (!API_CONFIG.apiKey && window.location.pathname.indexOf('settings.html') === -1) {
    console.warn('未配置 API 密钥，请前往设置页面配置');
  }
}

// ============================================
// 拖拽上传功能
// ============================================

/**
 * 初始化拖拽上传
 */
function initDragUpload(uploadArea, fileInput, onFileSelect) {
  if (!uploadArea || !fileInput) return;
  
  // 点击上传
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  });
  
  // 拖拽事件
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  });
}

// ============================================
// 视频相关功能
// ============================================

/**
 * 创建视频卡片
 */
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.dataset.videoId = video.id;
  
  const statusClass = video.status === 'completed' ? 'completed' : 
                      video.status === 'processing' ? 'processing' : 'failed';
  const statusText = video.status === 'completed' ? '已完成' : 
                     video.status === 'processing' ? '生成中' : '失败';
  
  card.innerHTML = `
    <div class="video-thumbnail">
      ${video.status === 'completed' && video.thumbnail_url 
        ? `<img src="${video.thumbnail_url}" alt="${video.title || '视频'}">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted)">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
               <line x1="7" y1="2" x2="7" y2="22"></line>
               <line x1="17" y1="2" x2="17" y2="22"></line>
               <line x1="2" y1="12" x2="22" y2="12"></line>
               <line x1="2" y1="7" x2="7" y2="7"></line>
               <line x1="2" y1="17" x2="7" y2="17"></line>
               <line x1="2" y1="22" x2="22" y2="22"></line>
             </svg>
           </div>`
      }
      ${video.status === 'completed' ? `<span class="video-duration">${formatDuration(video.duration || 15)}</span>` : ''}
      <div class="video-play-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>
    </div>
    <div class="video-info">
      <h3 class="video-title">${video.title || video.prompt || '未命名视频'}</h3>
      <div class="video-meta">
        <span class="video-status ${statusClass}">${statusText}</span>
        <span>${formatTime(video.created_at)}</span>
      </div>
    </div>
  `;
  
  // 点击跳转详情
  card.addEventListener('click', () => {
    if (video.status === 'completed') {
      window.location.href = `video-detail.html?id=${video.id}`;
    }
  });
  
  return card;
}

/**
 * 加载视频列表
 */
async function loadVideoList(container) {
  if (!container) return;
  
  try {
    setLoading(true, '加载视频中...');
    const response = await apiRequest('/videos');
    
    container.innerHTML = '';
    
    if (!response.data || response.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="2" y1="22" x2="22" y2="22"></line>
          </svg>
          <h3 class="empty-title">还没有视频</h3>
          <p class="empty-description">快去创建你的第一个短视频吧！</p>
          <a href="index.html" class="btn btn-primary">创建视频</a>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    
    response.data.forEach(video => {
      grid.appendChild(createVideoCard(video));
    });
    
    container.appendChild(grid);
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">加载失败</h3>
        <p class="empty-description">${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">重试</button>
      </div>
    `;
    showToast('加载视频列表失败', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * 删除视频
 */
async function deleteVideo(videoId, callback) {
  if (!confirm('确定要删除这个视频吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    setLoading(true, '删除中...');
    await apiRequest(`/videos/${videoId}`, { method: 'DELETE' });
    showToast('视频已删除', 'success');
    if (callback) callback();
  } catch (error) {
    showToast('删除失败：' + error.message, 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * 下载视频
 */
function downloadVideo(videoUrl, filename) {
  const a = document.createElement('a');
  a.href = videoUrl;
  a.download = filename || 'video.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('开始下载', 'success');
}

// ============================================
// 轮询任务状态
// ============================================

/**
 * 轮询任务状态直到完成
 */
async function pollTaskStatus(taskId, onProgress, onComplete, onError) {
  const maxAttempts = 180; // 最多轮询 3 分钟（每秒一次）
  let attempts = 0;
  
  const poll = async () => {
    try {
      const response = await apiRequest(`/tasks/${taskId}`);
      const task = response.data;
      
      if (onProgress) {
        onProgress(task);
      }
      
      if (task.status === 'completed') {
        if (onComplete) onComplete(task);
        return;
      }
      
      if (task.status === 'failed') {
        if (onError) onError(new Error(task.error || '生成失败'));
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000);
      } else {
        if (onError) onError(new Error('生成超时，请稍后重试'));
      }
    } catch (error) {
      if (onError) onError(error);
    }
  };
  
  poll();
}

// ============================================
// 页面特定功能
// ============================================

/**
 * 首页 - 视频生成表单
 */
function initHomePage() {
  const form = document.getElementById('generate-form');
  const promptInput = document.getElementById('prompt');
  const styleSelect = document.getElementById('style');
  const durationSelect = document.getElementById('duration');
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('image-upload');
  const uploadPreview = document.getElementById('upload-preview');
  const uploadFileName = document.getElementById('upload-file-name');
  const submitBtn = document.getElementById('submit-btn');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  let selectedFile = null;
  
  // 初始化拖拽上传
  initDragUpload(uploadArea, fileInput, async (file) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }
    
    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过 10MB', 'error');
      return;
    }
    
    selectedFile = file;
    
    // 显示预览
    const base64 = await fileToBase64(file);
    uploadPreview.src = base64;
    uploadPreview.style.display = 'block';
    uploadFileName.textContent = file.name;
    uploadArea.classList.add('has-file');
  });
  
  // 提交表单
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showToast('请输入视频描述', 'error');
      return;
    }
    
    // 准备提交数据
    const formData = {
      prompt: prompt,
      style: styleSelect.value,
      duration: parseInt(durationSelect.value)
    };
    
    // 如果有上传图片，转换为 base64
    if (selectedFile) {
      formData.image = await fileToBase64(selectedFile);
    }
    
    try {
      // 禁用提交按钮
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> 提交中...';
      
      // 发送生成请求
      const response = await apiRequest('/generate', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      const taskId = response.data.task_id;
      
      // 显示进度
      progressContainer.classList.remove('hidden');
      
      // 轮询任务状态
      pollTaskStatus(
        taskId,
        (task) => {
          // 更新进度
          const progress = task.progress || 0;
          progressFill.style.width = `${progress}%`;
          progressText.innerHTML = `
            <span>${task.status === 'processing' ? '生成中...' : task.status}</span>
            <span>${progress}%</span>
          `;
        },
        (task) => {
          // 完成
          showToast('视频生成成功！', 'success');
          setTimeout(() => {
            window.location.href = `video-detail.html?id=${task.video_id}`;
          }, 1000);
        },
        (error) => {
          // 失败
          showToast('生成失败：' + error.message, 'error');
          progressFill.style.width = '0';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '生成视频';
        }
      );
      
    } catch (error) {
      showToast('提交失败：' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '生成视频';
    }
  });
}

/**
 * 视频库页面
 */
function initVideosPage() {
  const videoContainer = document.getElementById('video-container');
  loadVideoList(videoContainer);
}

/**
 * 视频详情页面
 */
async function initVideoDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');
  
  if (!videoId) {
    showToast('视频 ID 不存在', 'error');
    setTimeout(() => window.location.href = 'videos.html', 1000);
    return;
  }
  
  try {
    setLoading(true, '加载视频详情...');
    const response = await apiRequest(`/videos/${videoId}`);
    const video = response.data;
    
    if (!video) {
      throw new Error('视频不存在');
    }
    
    // 更新页面内容
    document.getElementById('video-player').src = video.video_url || '';
    document.getElementById('video-title').textContent = video.title || video.prompt || '未命名视频';
    document.getElementById('video-prompt').textContent = video.prompt || '无描述';
    document.getElementById('video-created-at').textContent = formatTime(video.created_at);
    document.getElementById('video-duration').textContent = formatDuration(video.duration || 15);
    document.getElementById('video-style').textContent = video.style || '默认';
    
    // 绑定按钮事件
    document.getElementById('download-btn').addEventListener('click', () => {
      downloadVideo(video.video_url, `${video.title || 'video'}.mp4`);
    });
    
    document.getElementById('delete-btn').addEventListener('click', () => {
      deleteVideo(videoId, () => {
        window.location.href = 'videos.html';
      });
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
      window.history.back();
    });
    
  } catch (error) {
    showToast('加载失败：' + error.message, 'error');
    setTimeout(() => window.location.href = 'videos.html', 1000);
  } finally {
    setLoading(false);
  }
}

/**
 * 设置页面
 */
function initSettingsPage() {
  const apiKeyInput = document.getElementById('api-key');
  const baseUrlInput = document.getElementById('base-url');
  const saveBtn = document.getElementById('save-settings-btn');
  const testBtn = document.getElementById('test-api-btn');
  
  // 加载当前配置
  apiKeyInput.value = API_CONFIG.apiKey;
  baseUrlInput.value = API_CONFIG.baseURL;
  
  // 保存设置
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const baseUrl = baseUrlInput.value.trim();
    
    if (!apiKey) {
      showToast('请输入 API 密钥', 'error');
      return;
    }
    
    if (!baseUrl) {
      showToast('请输入 API 地址', 'error');
      return;
    }
    
    localStorage.setItem('api_key', apiKey);
    localStorage.setItem('api_base_url', baseUrl);
    
    API_CONFIG.apiKey = apiKey;
    API_CONFIG.baseURL = baseUrl;
    
    showToast('设置已保存', 'success');
  });
  
  // 测试 API 连接
  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const baseUrl = baseUrlInput.value.trim();
    
    if (!apiKey || !baseUrl) {
      showToast('请先填写 API 密钥和地址', 'error');
      return;
    }
    
    try {
      setLoading(true, '测试连接中...');
      
      // 临时更新配置
      const oldKey = API_CONFIG.apiKey;
      const oldUrl = API_CONFIG.baseURL;
      API_CONFIG.apiKey = apiKey;
      API_CONFIG.baseURL = baseUrl;
      
      await apiRequest('/health');
      
      API_CONFIG.apiKey = oldKey;
      API_CONFIG.baseURL = oldUrl;
      
      showToast('连接成功！', 'success');
    } catch (error) {
      showToast('连接失败：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  });
}

// ============================================
// 应用启动
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  checkApiConfig();
  
  // 根据页面初始化相应功能
  const page = window.location.pathname.split('/').pop() || 'index.html';
  
  switch (page) {
    case 'index.html':
      initHomePage();
      break;
    case 'videos.html':
      initVideosPage();
      break;
    case 'video-detail.html':
      initVideoDetailPage();
      break;
    case 'settings.html':
      initSettingsPage();
      break;
  }
});
