/**
 * 登录/注册页面逻辑
 */

// 标签切换
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(`${target}-form`).classList.add('active');
  });
});

// 显示提示
function showAlert(type, message, formId) {
  const alertEl = document.getElementById(`${formId}-alert`);
  alertEl.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  
  setTimeout(() => {
    alertEl.innerHTML = '';
  }, 5000);
}

// 设置按钮加载状态
function setButtonLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  if (loading) {
    btn.disabled = true;
    text.innerHTML = '<span class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> 处理中...';
  } else {
    btn.disabled = false;
    text.textContent = btn.type === 'submit' ? (btn.closest('#login-form') ? '登录' : '注册') : '';
  }
}

// 登录表单
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  
  setButtonLoading(btn, true);
  
  try {
    await Auth.login(username, password);
    showAlert('success', '登录成功，正在跳转...', 'login');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    showAlert('error', error.message || '登录失败，请检查用户名和密码', 'login');
    setButtonLoading(btn, false);
  }
});

// 注册表单
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  
  setButtonLoading(btn, true);
  
  try {
    await Auth.register(username, email, password);
    showAlert('success', '注册成功，正在跳转...', 'register');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    showAlert('error', error.message || '注册失败', 'register');
    setButtonLoading(btn, false);
  }
});

// 如果已登录，跳转到首页
if (Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}
