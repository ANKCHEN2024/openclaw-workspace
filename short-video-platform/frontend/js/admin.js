/**
 * 管理员后台页面逻辑
 */

// 检查管理员权限
if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

if (!Auth.isAdmin()) {
  alert('需要管理员权限');
  window.location.href = 'index.html';
}

// 加载仪表盘数据
async function loadDashboard() {
  try {
    const response = await Auth.authRequest('/admin/dashboard');
    if (response.success) {
      document.getElementById('stat-users').textContent = response.data.users.count || 0;
      document.getElementById('stat-videos').textContent = response.data.videos.total_videos || 0;
      document.getElementById('stat-tasks').textContent = response.data.tasks.total || 0;
      document.getElementById('stat-processing').textContent = response.data.tasks.processing || 0;
    }
  } catch (error) {
    console.error('加载仪表盘失败:', error);
  }
}

// 加载用户列表
async function loadUsers() {
  try {
    const response = await Auth.authRequest('/admin/users');
    if (response.success) {
      renderUsers(response.data.users);
      document.getElementById('users-loading').style.display = 'none';
      document.getElementById('users-content').style.display = 'block';
    }
  } catch (error) {
    document.getElementById('users-loading').innerHTML = `
      <div class="error-message">加载失败: ${error.message}</div>
    `;
  }
}

// 渲染用户列表
function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>
        <span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">
          ${user.is_admin ? '管理员' : '用户'}
        </span>
      </td>
      <td>${new Date(user.created_at).toLocaleString()}</td>
      <td>
        ${user.id !== Auth.getUser().id ? `
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">
            删除
          </button>
        ` : '<span style="color: #999;">自己</span>'}
      </td>
    </tr>
  `).join('');
}

// 删除用户
async function deleteUser(userId) {
  if (!confirm('确定要删除此用户吗？此操作不可恢复！')) {
    return;
  }
  
  try {
    await Auth.authRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
    showToast('用户已删除', 'success');
    loadUsers();
    loadDashboard();
  } catch (error) {
    showToast(error.message || '删除失败', 'error');
  }
}

// 初始化
loadDashboard();
loadUsers();
