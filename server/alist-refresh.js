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
const defaultLogPath = path.join(__dirname, 'logs', 'csnews.log');

// 获取活跃的日志监控配置路径
const activeLogConfig = config.logMonitorConfigs?.find(c => c.status === 'active');
const logFile = defaultLogPath;

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
        // 读取文件的最后一行
        const fileContent = fs.readFileSync(logFile, 'utf8');
        const lines = fileContent.trim().split('\n');
        const lastLine = lines.slice(-1);

        // 处理最后一行
        for (const line of lastLine) {
            try {
                // 检查是否包含保存文件的信息
                if (line.includes('收到CS请求')) {
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
                                const delayTime = task.delayTime || 0;
                                
                                // 检查是否启用路径匹配功能
                                if (task.pathMatch === true) {
                                    // 提取日志中的资源路径信息
                                    const resourcePathMatch = line.match(/"资源路径":"([^"]+)"/);
                                    if (resourcePathMatch && resourcePathMatch[1]) {
                                        const resourcePath = resourcePathMatch[1];
                                        logger.info('检测到资源路径', { resourcePath });
                                        
                                        // 处理资源路径
                                        let newPath;
                                        if (resourcePath.startsWith('全部文件')) {
                                            // 去掉"全部文件"前缀，与monitorPath拼接
                                            const relativePath = resourcePath.replace('全部文件', '');
                                            newPath = task.monitorPath + relativePath;
                                        } else {
                                            // 如果路径不以'全部文件'开头，在monitorPath和resourcePath之间添加/分隔符
                                            newPath = task.monitorPath + '/' + resourcePath;
                                        }
                                        logger.info('路径匹配模式：处理后的路径', { originalPath: resourcePath, newPath });
                                        
                                        // 使用setTimeout来延迟执行API调用
                                        setTimeout(() => {
                                            axios.post(`${alistConfig.address}/api/fs/list`, {
                                                "path": newPath,
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
                                                logger.info('成功刷新Alist目录(路径匹配模式)', {
                                                    originalPath: resourcePath,
                                                    path: newPath,
                                                    delayTime: delayTime,
                                                    status: response.status,
                                                    data: response.data
                                                });
                                            })
                                            .catch(error => {
                                                logger.error('调用Alist API失败(路径匹配模式)', {
                                                    originalPath: resourcePath,
                                                    path: newPath,
                                                    error: error.message,
                                                    status: error.response?.status,
                                                    data: error.response?.data,
                                                    headers: error.response?.headers
                                                });
                                            });
                                        }, delayTime * 1000); // 将秒转换为毫秒
                                    } else {
                                        logger.warn('路径匹配模式：未在日志中找到资源路径信息');
                                    }
                                } else {
                                    // 原有的刷新逻辑（pathMatch为false或未设置）
                                    const monitorPath = task.monitorPath;
                                    
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
                                            logger.info('成功刷新Alist目录(常规模式)', {
                                                path: monitorPath,
                                                delayTime: delayTime,
                                                status: response.status,
                                                data: response.data
                                            });
                                        })
                                        .catch(error => {
                                            logger.error('调用Alist API失败(常规模式)', {
                                                path: monitorPath,
                                                error: error.message,
                                                status: error.response?.status,
                                                data: error.response?.data,
                                                headers: error.response?.headers
                                            });
                                        });
                                    }, delayTime * 1000); // 将秒转换为毫秒
                                }
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