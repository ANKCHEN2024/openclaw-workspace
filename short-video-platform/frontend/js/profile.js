/**
 * 个人中心页面逻辑
 */

// 检查登录状态
if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

// 加载用户信息
async function loadUserInfo() {
  try {
    const user = Auth.getUser();
    
    if (!user) {
      const response = await Auth.getCurrentUser();
      if (response.success) {
        localStorage.setItem('sv_user', JSON.stringify(response.data));
        updateUI(response.data);
      }
    } else {
      updateUI(user);
    }
  } catch (error) {
    showToast('获取用户信息失败', 'error');
  }
}

// 更新界面
function updateUI(user) {
  document.getElementById('user-name').textContent = user.username;
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('profile-username').value = user.username;
  document.getElementById('profile-email').value = user.email;
}

// 加载统计数据
async function loadStats() {
  try {
    // 获取视频统计
    const videosResponse = await Auth.authRequest('/videos');
    if (videosResponse.success) {
      document.getElementById('stat-videos').textContent = videosResponse.data.length;
    }
    
    // 获取任务统计
    const tasksResponse = await Auth.authRequest('/tasks/stats/overview');
    if (tasksResponse.success) {
      document.getElementById('stat-tasks').textContent = tasksResponse.data.total;
      document.getElementById('stat-processing').textContent = tasksResponse.data.processing;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 更新资料表单
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('profile-username').value;
  const email = document.getElementById('profile-email').value;
  
  try {
    const response = await Auth.updateProfile({ username, email });
    if (response.success) {
      // 更新本地存储
      const user = Auth.getUser();
      user.username = username;
      user.email = email;
      localStorage.setItem('sv_user', JSON.stringify(user));
      
      updateUI(user);
      Auth.updateNavbar();
      showToast('资料更新成功', 'success');
    }
  } catch (error) {
    showToast(error.message || '更新失败', 'error');
  }
});

// 修改密码表单
document.getElementById('password-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showToast('两次输入的新密码不一致', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showToast('新密码至少需要6位字符', 'error');
    return;
  }
  
  try {
    const response = await Auth.changePassword(currentPassword, newPassword);
    if (response.success) {
      showToast('密码修改成功', 'success');
      document.getElementById('password-form').reset();
    }
  } catch (error) {
    showToast(error.message || '修改失败', 'error');
  }
});

// 退出登录
document.getElementById('logout-btn')?.addEventListener('click', () => {
  if (confirm('确定要退出登录吗？')) {
    Auth.logout();
  }
});

// 初始化
loadUserInfo();
loadStats();
