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
function getTaosyncTasks() {
    try {
        const autoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'auto.json'), 'utf8'));
        return autoConfig.automationTasks.filter(task => 
            task.program === 'taosync' && task.status === 'active' && task.portId === 1
        );
    } catch (error) {
        logger.error('读取auto.json失败', { error: error.message });
        return [];
    }
}

// 创建WebSocket服务器，端口号为config.server.port + portId
const wss = new WebSocket.Server({ port: config.server.port + 1 -200 });

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
        
        // 添加调试日志，显示读取到的最后一行内容
        logger.debug('读取到的最后一行日志:', { lines: lastLine });

        // 处理最后一行
        for (const line of lastLine) {
            try {
                logger.debug('正在解析日志行:', { line });
                
                // 检查是否包含收到CS请求的信息
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
                    
                        // 获取taosync的自动化任务配置
                        const taosyncTasks = getTaosyncTasks();
                        // 获取第一个可用的taosync配置
                        const taosyncConfig = Object.values(config.taosync || {})[0];
                    
                        if (taosyncConfig && taosyncConfig.apiKey && taosyncConfig.address && taosyncTasks.length > 0) {
                            // 遍历每个任务配置
                            taosyncTasks.forEach(task => {
                                const delayTime = task.delayTime || 0;
                                
                                // 检查是否启用路径匹配功能
                                if (task.pathMatch === true) {
                                    // 提取日志中的资源路径信息
                                    const resourcePathMatch = line.match(/"资源路径":"([^"]+)"/);
                                    if (resourcePathMatch && resourcePathMatch[1]) {
                                        const resourcePath = resourcePathMatch[1];
                                        logger.info('检测到资源路径', { resourcePath });
                                        
                                        // 解析configId中的路径映射
                                        const pathMappings = task.configId.split(',').map(mapping => {
                                            const [path, id] = mapping.split('=');
                                            return { path, id };
                                        });
                                        
                                        // 查找匹配的路径
                                        const matchedMapping = pathMappings.find(mapping => resourcePath.startsWith(mapping.path));
                                        
                                        if (matchedMapping) {
                                            const configId = matchedMapping.id;
                                            logger.info('路径匹配成功', { resourcePath, configId });
                                            
                                            // 使用setTimeout来延迟执行API调用
                                            setTimeout(() => {
                                                axios.post(`${taosyncConfig.address}/api/job`, {
                                                    "id": configId
                                                }, {
                                                    headers: {
                                                        'api-key': taosyncConfig.apiKey
                                                    }
                                                })
                                                .then(() => {
                                                    logger.info('成功触发taosync配置运行(路径匹配模式)', { 
                                                        resource_path: resourcePath,
                                                        config_id: configId, 
                                                        delay_time: delayTime 
                                                    });
                                                })
                                                .catch(error => {
                                                    logger.error('调用taosync API失败(路径匹配模式)', { 
                                                        resource_path: resourcePath,
                                                        config_id: configId, 
                                                        error: error.message 
                                                    });
                                                });
                                            }, delayTime * 1000); // 将秒转换为毫秒
                                        } else {
                                            logger.warn('路径匹配模式：未找到匹配的路径配置', { resourcePath });
                                        }
                                    } else {
                                        logger.warn('路径匹配模式：未在日志中找到资源路径信息');
                                    }
                                } else {
                                    // 原有的API调用逻辑（pathMatch为false或未设置）
                                    const configId = task.configId;
                                    
                                    // 使用setTimeout来延迟执行API调用
                                    setTimeout(() => {
                                        axios.post(`${taosyncConfig.address}/api/job`, {
                                                "id": configId
                                            }, {
                                                headers: {
                                                    'api-key': taosyncConfig.apiKey
                                                }
                                            })
                                        .then(() => {
                                            logger.info('成功触发taosync配置运行(常规模式)', { config_id: configId, delay_time: delayTime });
                                        })
                                        .catch(error => {
                                            logger.error('调用taosync API失败(常规模式)', { config_id: configId, error: error.message });
                                        });
                                    }, delayTime * 1000); // 将秒转换为毫秒
                                }
                            });
                        }
                    
                        logger.info('文件转存成功，已发送信息到taosync');
                        debounceTimer = null;
                        lastMessage = null;
                    }, 2000); // 2秒的防抖时间
                }
            } catch (error) {
                // 记录解析错误的日志行
                logger.debug('解析日志行失败:', { line, error: error.message });
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
    port: config.server.port + 1 -200,
    logFile: logFile
});

// 获取并显示taosync任务配置信息
const taosyncTasks = getTaosyncTasks();
// 获取第一个可用的taosync配置
const taosyncConfig = Object.values(config.taosync || {})[0];

if (taosyncConfig && taosyncConfig.apiKey && taosyncConfig.address && taosyncTasks.length > 0) {
    logger.info('Taosync任务配置信息', {
        tasks: taosyncTasks.map(task => ({
            config_id: task.configId,
            api_url: `${taosyncConfig.address}/api/job`,
            delay_time: task.delayTime || 0
        }))
    });
} else {
    logger.info('未找到有效的Taosync任务配置');
}