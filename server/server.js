const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const logMonitorRoutes = require('./routes/log-monitor');
const alistRoutes = require('./routes/alist');
const alistStrmRoutes = require('./routes/alist-strm');
const taosyncRoutes = require('./routes/taosync');
const automationRoutes = require('./routes/automation');
const authRoutes = require('./routes/auth');

// 启动自动化任务服务
function startAutomationServices() {
    try {
        const autoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'auto.json'), 'utf8'));
        const activeTasks = autoConfig.automationTasks.filter(task => task.status === 'active');

        activeTasks.forEach(task => {
            try {
                if (task.program === 'alist-strm') {
                    const process = spawn('node', [path.join(__dirname, 'alist-strm-api.js')]);
                    process.on('error', (err) => {
                        console.error(`alist-strm-api服务启动失败: ${err.message}`);
                    });
                    process.on('spawn', () => {
                        console.log('alist-strm-api服务已启动');
                    });
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

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = 9009;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    // 启动活动状态的自动化任务服务
    startAutomationServices();
});