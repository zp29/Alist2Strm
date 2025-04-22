const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const AUTH_FILE_PATH = path.join(__dirname, '../data/auth.json');
const JWT_SECRET = 'qilinauto-qilinauto-001';

// 初始化默认用户数据
async function createDefaultAuthData() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  return {
    users: {
      admin: {
        username: 'admin',
        password: hashedPassword
      }
    }
  };
}

// 读取用户数据
async function readAuthFile() {
  try {
    try {
      const data = await fs.readFile(AUTH_FILE_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 如果文件不存在，创建默认用户文件
        const defaultData = await createDefaultAuthData();
        await saveAuthFile(defaultData);
        return defaultData;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading auth file:', error);
    throw new Error('无法读取用户数据');
  }
}

// 保存用户数据
async function saveAuthFile(data) {
  try {
    await fs.writeFile(AUTH_FILE_PATH, JSON.stringify(data, null, 2), { mode: 0o644 });
  } catch (error) {
    console.error('Error saving auth file:', error);
    throw new Error('无法保存用户数据');
  }
}

// 更新用户设置
router.post('/update-settings', async (req, res) => {
  try {
    const { username, newUsername, newPassword } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }

    // 读取用户数据
    let authData;
    try {
      authData = await readAuthFile();
    } catch (error) {
      console.error('读取用户数据失败:', error);
      return res.status(500).json({ error: '无法读取用户数据' });
    }

    const user = authData.users[username];
    // 更新用户信息
    const updates = {};
    
    if (newUsername && newUsername !== username) {
      updates.username = newUsername;
    }

    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // 应用更新
    const updatedUser = {
      username: newUsername || username,
      password: updates.password || user.password
    };

    if (newUsername && newUsername !== username) {
      delete authData.users[username];
      authData.users[newUsername] = updatedUser;
    } else {
      authData.users[username] = updatedUser;
    }

    // 保存更新后的数据
    await saveAuthFile(authData);

    res.json({ 
      message: '设置更新成功',
      username: updates.username || username
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  }
});

// 登录验证
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 读取用户数据
    const authData = await readAuthFile();
    const user = authData.users[username];

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      token,
      username: user.username
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  }
});

module.exports = router;