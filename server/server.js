const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { apiKeyAuth } = require('./middleware/apiKeyAuth');
const logMonitorRoutes = require('./routes/log-monitor');
const alistRoutes = require('./routes/alist');
const alistStrmRoutes = require('./routes/alist-strm');
const taosyncRoutes = require('./routes/taosync');
const automationRoutes = require('./routes/automation');
const authRoutes = require('./routes/auth');
const apiTestRoutes = require('./routes/apitest');
const csNewsRoutes = require('./csnews');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// 生成API令牌
function generateApiKey() {
  // 生成32位随机字符串
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 检查并确保配置文件存在
function ensureConfig() {
  try {
    // 检查配置文件是否存在
    if (!fs.existsSync(CONFIG_FILE)) {
      // 创建默认配置
      const defaultConfig = {
        server: { port: 10008 },
        alist_strm: {},
        logMonitorConfigs: [],
        taosync: {},
        alist: {}
      };
      // 确保目录存在
      const configDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      // 写入默认配置
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      console.log('已创建默认配置文件');
      return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (error) {
    console.error('读取或创建配置文件失败:', error);
    return null;
  }
}

// 检查并确保日志监控配置存在
function ensureApiKey() {
  try {
    let config = ensureConfig();
    
    // 如果logMonitorConfigs不存在或为空数组，创建新的监控配置
    if (!config.logMonitorConfigs || config.logMonitorConfigs.length === 0) {
      const newApiKey = generateApiKey();
      const newConfig = {
        id: Date.now().toString(),
        createTime: (() => {
          const now = new Date();
          return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        })(),
        api_key: newApiKey,
        logPath: '/app/server/logs/csnews.log',
        status: 'active'
      };
      
      if (!config.logMonitorConfigs) {
        config.logMonitorConfigs = [];
      }
      
      config.logMonitorConfigs.push(newConfig);
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log('已生成新的API令牌配置');
    }
    
    return config.logMonitorConfigs[0].api_key;
  } catch (error) {
    console.error('读取或更新API令牌配置失败:', error);
    return '';
  }
}

// 启动自动化任务服务
function startAutomationServices() {
    try {
        const autoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'auto.json'), 'utf8'));
        const activeTasks = autoConfig.automationTasks.filter(task => task.status === 'active');

        activeTasks.forEach(task => {
            try {
                if (task.program === 'alist-strm') {
                    const processPath = path.join(__dirname, `alist-strm-api-${task.portId}.js`);
                    try {
                        // 读取原始文件内容
                        const content = fs.readFileSync(path.join(__dirname, 'alist-strm-api.js'), 'utf8');
                        // 修改文件内容中的portId和WebSocket端口配置
                        const updatedContent = content
                            .replace(/task\.portId === 1/g, `task.portId === ${task.portId}`)
                            .replace(/port: config\.server\.port \+ 1/g, `port: config.server.port + ${task.portId}`);
                        // 写入修改后的内容到新文件
                        fs.writeFileSync(processPath, updatedContent);
                        const process = spawn('node', [processPath]);
                        process.on('error', (err) => {
                            console.error(`alist-strm-api-${task.portId}服务启动失败: ${err.message}`);
                            // 清理失败的进程文件
                            if (fs.existsSync(processPath)) {
                                fs.unlinkSync(processPath);
                            }
                        });
                        process.on('spawn', () => {
                            console.log(`alist-strm-api-${task.portId}服务已启动`);
                        });
                        process.on('exit', (code) => {
                            if (code !== 0) {
                                console.error(`alist-strm-api-${task.portId}服务异常退出，退出码: ${code}`);
                                // 清理异常退出的进程文件
                                if (fs.existsSync(processPath)) {
                                    fs.unlinkSync(processPath);
                                }
                            }
                        });
                    } catch (copyError) {
                        console.error(`复制alist-strm-api文件失败: ${copyError.message}`);
                    }
                } else if (task.program === 'alist') {
                    const processPath = path.join(__dirname, `alist-refresh-${task.portId}.js`);
                    try {
                        // 读取原始文件内容
                        const content = fs.readFileSync(path.join(__dirname, 'alist-refresh.js'), 'utf8');
                        // 修改文件内容中的portId和WebSocket端口配置
                        const updatedContent = content
                            .replace(/task\.portId === 1/g, `task.portId === ${task.portId}`)
                            .replace(/port: config\.server\.port \+ 1/g, `port: config.server.port + ${task.portId}`);
                        // 写入修改后的内容到新文件
                        fs.writeFileSync(processPath, updatedContent);
                        const process = spawn('node', [processPath]);
                        process.on('error', (err) => {
                            console.error(`alist-refresh-${task.portId}服务启动失败: ${err.message}`);
                            // 清理失败的进程文件
                            if (fs.existsSync(processPath)) {
                                fs.unlinkSync(processPath);
                            }
                        });
                        process.on('spawn', () => {
                            console.log(`alist-refresh-${task.portId}服务已启动`);
                        });
                        process.on('exit', (code) => {
                            if (code !== 0) {
                                console.error(`alist-refresh-${task.portId}服务异常退出，退出码: ${code}`);
                                // 清理异常退出的进程文件
                                if (fs.existsSync(processPath)) {
                                    fs.unlinkSync(processPath);
                                }
                            }
                        });
                    } catch (copyError) {
                        console.error(`复制alist-refresh文件失败: ${copyError.message}`);
                    }
                } else if (task.program === 'taosync') {
                    const processPath = path.join(__dirname, `taosync-${task.portId}.js`);
                    try {
                        // 读取原始文件内容
                        const content = fs.readFileSync(path.join(__dirname, 'taosync.js'), 'utf8');
                        // 修改文件内容中的portId和WebSocket端口配置
                        const updatedContent = content
                            .replace(/task\.portId === 1/g, `task.portId === ${task.portId}`)
                            .replace(/port: config\.server\.port \+ 1/g, `port: config.server.port + ${task.portId}`);
                        // 写入修改后的内容到新文件
                        fs.writeFileSync(processPath, updatedContent);
                        const process = spawn('node', [processPath]);
                        process.on('error', (err) => {
                            console.error(`taosync-${task.portId}服务启动失败: ${err.message}`);
                            // 清理失败的进程文件
                            if (fs.existsSync(processPath)) {
                                fs.unlinkSync(processPath);
                            }
                        });
                        process.on('spawn', () => {
                            console.log(`taosync-${task.portId}服务已启动`);
                        });
                        process.on('exit', (code) => {
                            if (code !== 0) {
                                console.error(`taosync-${task.portId}服务异常退出，退出码: ${code}`);
                                // 清理异常退出的进程文件
                                if (fs.existsSync(processPath)) {
                                    fs.unlinkSync(processPath);
                                }
                            }
                        });
                    } catch (copyError) {
                        console.error(`复制taosync文件失败: ${copyError.message}`);
                    }
                }
            } catch (taskError) {
                console.error(`启动任务${task.program}失败:`, taskError);
            }
        });
    } catch (error) {
        console.error('启动自动化任务服务失败:', error);
    }
}

const app = express();

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// API测试路由（需要API令牌验证）
app.use('/api/test', apiKeyAuth, apiTestRoutes);

// 日志监控API路由
app.use('/api/log-monitor', logMonitorRoutes);

// Alist-strm API路由
app.use('/api/alist', alistRoutes);

// Alist-strm API路由
app.use('/api/alist-strm', alistStrmRoutes);

// Taosync API路由
app.use('/api/taosync', taosyncRoutes);

// 自动化任务API路由
app.use('/api/automation', automationRoutes);

// 用户认证API路由
app.use('/api/auth', authRoutes);

// CS信息路由
app.use('/api/cs', apiKeyAuth, csNewsRoutes);


// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = 9009;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    // 确保配置文件和API令牌存在
    ensureApiKey();
    // 启动活动状态的自动化任务服务
    startAutomationServices();
});