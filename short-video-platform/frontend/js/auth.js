/**
 * 认证管理模块
 * 处理登录状态、Token 管理和 API 请求
 */

const AUTH_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  tokenKey: 'sv_token',
  userKey: 'sv_user'
};

/**
 * 获取存储的 Token
 */
function getToken() {
  return localStorage.getItem(AUTH_CONFIG.tokenKey);
}

/**
 * 获取存储的用户信息
 */
function getUser() {
  const userStr = localStorage.getItem(AUTH_CONFIG.userKey);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 保存登录信息
 */
function saveAuth(token, user) {
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
  localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
}

/**
 * 清除登录信息
 */
function clearAuth() {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.userKey);
}

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  return !!getToken();
}

/**
 * 检查是否为管理员
 */
function isAdmin() {
  const user = getUser();
  return user && user.is_admin;
}

/**
 * 需要登录的请求封装
 */
async function authRequest(endpoint, options = {}) {
  const url = `${AUTH_CONFIG.baseURL}${endpoint}`;
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Token 过期
      if (response.status === 401) {
        clearAuth();
        showToast('登录已过期，请重新登录', 'warning');
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
 * 登录
 */
async function login(username, password) {
  const response = await fetch(`${AUTH_CONFIG.baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || '登录失败');
  }
  
  saveAuth(data.data.token, data.data.user);
  return data.data;
}

/**
 * 注册
 */
async function register(username, email, password) {
  const response = await fetch(`${AUTH_CONFIG.baseURL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || '注册失败');
  }
  
  saveAuth(data.data.token, data.data.user);
  return data.data;
}

/**
 * 登出
 */
function logout() {
  clearAuth();
  window.location.href = 'index.html';
}

/**
 * 获取当前用户信息
 */
async function getCurrentUser() {
  return authRequest('/auth/me');
}

/**
 * 更新用户信息
 */
async function updateProfile(updates) {
  return authRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * 修改密码
 */
async function changePassword(currentPassword, newPassword) {
  return authRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

/**
 * 更新导航栏显示
 */
function updateNavbar() {
  const user = getUser();
  const nav = document.querySelector('.navbar-nav');
  
  if (!nav) return;
  
  // 查找或创建用户菜单
  let userMenu = nav.querySelector('.user-menu');
  
  if (user) {
    // 已登录
    if (!userMenu) {
      userMenu = document.createElement('li');
      userMenu.className = 'user-menu';
      nav.appendChild(userMenu);
    }
    
    // 如果是管理员，显示管理入口
    const adminLink = user.is_admin ? `
      <a href="admin.html" class="nav-link" style="color: #667eea;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        管理
      </a>
    ` : '';
    
    userMenu.innerHTML = `
      ${adminLink}
      <a href="profile.html" class="nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        ${user.username}
      </a>
    `;
  } else {
    // 未登录
    if (!userMenu) {
      userMenu = document.createElement('li');
      userMenu.className = 'user-menu';
      nav.appendChild(userMenu);
    }
    
    userMenu.innerHTML = `
      <a href="login.html" class="nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10,17 15,12 10,7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        登录
      </a>
    `;
  }
}

// 页面加载时更新导航栏
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
});

// 导出函数
window.Auth = {
  getToken,
  getUser,
  isLoggedIn,
  isAdmin,
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  authRequest,
  updateNavbar
};
