const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const createLogger = require('./logger');

// 创建日志记录器
const logger = createLogger(__filename);

// 读取配置文件
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'config.json'), 'utf8'));

// 读取自动化任务配置
function getAlistTasks() {
    try {
        const autoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'auto.json'), 'utf8'));
        return autoConfig.automationTasks.filter(task => 
            task.program === 'alist' && task.status === 'active' && task.portId === 1
        );
    } catch (error) {
        logger.error('读取auto.json失败', { error: error.message });
        return [];
    }
}

// 创建WebSocket服务器，端口号为config.server.port + portId
const wss = new WebSocket.Server({ port: config.server.port + 1 });

// 存储所有连接的客户端
const clients = new Set();

// WebSocket连接处理
wss.on('connection', (ws) => {
    // 将新连接的客户端添加到集合中
    clients.add(ws);
    logger.info('新的客户端连接');

    // 处理连接关闭
    ws.on('close', () => {
        clients.delete(ws);
        logger.info('客户端断开连接');
    });
});

// 设置默认日志文件路径
const defaultLogPath = path.join(__dirname, 'logs', 'combined.log');

// 获取活跃的日志监控配置路径
const activeLogConfig = config.logMonitorConfigs?.find(c => c.status === 'active');
const logFile = activeLogConfig?.logPath || defaultLogPath;

// 确保日志目录存在
const logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 如果文件不存在，创建一个空文件
if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}

// 用于防抖的变量
let debounceTimer = null;
let lastMessage = null;

// 创建文件监听器
const watcher = fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
        // 读取文件的最后两行
        const fileContent = fs.readFileSync(logFile, 'utf8');
        const lines = fileContent.trim().split('\n');
        const lastTwoLines = lines.slice(-2);

        // 处理最后两行
        for (const line of lastTwoLines) {
            try {
                // 检查是否包含保存文件的信息
                if (line.includes('保存文件')) {
                    const message = {
                        type: 'save_success',
                        timestamp: new Date().toISOString()
                    };
                    
                    // 清除之前的定时器
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    // 保存最新的消息
                    lastMessage = message;
                    
                    // 设置新的定时器
                    debounceTimer = setTimeout(() => {
                        // 向所有连接的客户端发送消息
                        clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(lastMessage));
                            }
                        });
                        
                        // 获取alist的自动化任务配置
                        const alistTasks = getAlistTasks();
                        // 获取第一个可用的alist配置
                        const alistConfig = Object.values(config.alist || {})[0];

                        if (alistConfig && alistConfig.apiKey && alistConfig.address && alistTasks.length > 0) {
                            // 遍历每个任务配置
                            alistTasks.forEach(task => {
                                const monitorPath = task.monitorPath;
                                const delayTime = task.delayTime || 0;

                                // 使用setTimeout来延迟执行API调用
                                setTimeout(() => {
                                    axios.post(`${alistConfig.address}/api/fs/list`, {
                                        "path": monitorPath,
                                        "password": "",
                                        "page": 1,
                                        "per_page": 0,
                                        "refresh": true
                                    }, {
                                        headers: {
                                            "Authorization": `${alistConfig.apiKey}`,
                                            "Content-Type": "application/json"
                                        }
                                    })
                                    .then((response) => {
                                        logger.info('成功刷新Alist目录', {
                                            path: monitorPath,
                                            delayTime: delayTime,
                                            status: response.status,
                                            data: response.data
                                        });
                                    })
                                    .catch(error => {
                                        logger.error('调用Alist API失败', {
                                            path: monitorPath,
                                            error: error.message,
                                            status: error.response?.status,
                                            data: error.response?.data,
                                            headers: error.response?.headers
                                        });
                                        
                                    });
                                }, delayTime * 1000); // 将秒转换为毫秒
                            });
                        }
                        
                        console.log('文件转存成功，已发送刷新请求到Alist');
                        debounceTimer = null;
                        lastMessage = null;
                    }, 2000); // 2秒的防抖时间
                }
            } catch (error) {
                // 忽略无法解析的日志行
            }
        }
    }
});

// 处理进程退出时清理资源
process.on('SIGINT', () => {
    watcher.close();
    wss.close();
    process.exit(0);
});

logger.info('WebSocket服务器已启动', {
    port: config.server.port + 1,
    logFile: logFile
});

// 获取并显示alist任务配置信息
const alistTasks = getAlistTasks();
// 获取第一个可用的alist配置
const alistConfig = Object.values(config.alist || {})[0];

if (alistConfig && alistConfig.apiKey && alistConfig.address && alistTasks.length > 0) {
    logger.info('Alist任务配置信息', {
        tasks: alistTasks.map(task => ({
            monitorPath: task.monitorPath,
            apiAddress: `${alistConfig.address}/api/fs/list`,
            delayTime: task.delayTime || 0
        }))
    });
} else {
    logger.warn('未找到有效的Alist任务配置');
}