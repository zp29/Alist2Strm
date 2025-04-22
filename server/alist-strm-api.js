const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const createLogger = require('./logger');

// 创建logger实例
const logger = createLogger(__filename);

// 读取配置文件
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'config.json'), 'utf8'));

// 读取自动化任务配置
function getAlistStrmTasks() {
    try {
        const autoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'auto.json'), 'utf8'));
        return autoConfig.automationTasks.filter(task => 
            task.program === 'alist-strm' && task.status === 'active'
        );
    } catch (error) {
        logger.error('读取auto.json失败', { error: error.message });
        return [];
    }
}

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: config.server.port });

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
        
        // 添加调试日志，显示读取到的最后两行内容
        logger.debug('读取到的最后两行日志:', { lines: lastTwoLines });

        // 处理最后两行
        for (const line of lastTwoLines) {
            try {
                logger.debug('正在解析日志行:', { line });
                
                // 检查是否包含时间戳和保存文件的信息
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
                    
                        // 获取alist-strm的自动化任务配置
                        const alistStrmTasks = getAlistStrmTasks();
                        // 获取第一个可用的alist_strm配置
                        const alistStrmConfig = Object.values(config.alist_strm || {})[0];
                    
                        if (alistStrmConfig && alistStrmConfig.apiKey && alistStrmConfig.address && alistStrmTasks.length > 0) {
                            // 遍历每个任务配置
                            alistStrmTasks.forEach(task => {
                                const configId = task.configId;
                                const delayTime = task.delayTime || 0;
                    
                                // 使用setTimeout来延迟执行API调用
                                setTimeout(() => {
                                    axios.post(`${alistStrmConfig.address}/api/run_config/${configId}`, null, {
                                        headers: {
                                            'X-API-Key': alistStrmConfig.apiKey
                                        }
                                    })
                                    .then(() => {
                                        logger.info('成功触发alist-strm配置运行', { config_id: configId, delay_time: delayTime });
                                    })
                                    .catch(error => {
                                        logger.error('调用alist-strm API失败', { config_id: configId, error: error.message });
                                    });
                                }, delayTime * 1000); // 将秒转换为毫秒
                            });
                        }
                    
                        logger.info('文件转存成功，已发送信息到Ailst-strm');
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

logger.info('WebSocket服务器已启动', { port: config.server.port });
logger.info('开始监控日志文件', { log_file: logFile });

// 获取并显示alist-strm任务配置信息
const alistStrmTasks = getAlistStrmTasks();
// 获取第一个可用的alist_strm配置
const alistStrmConfig = Object.values(config.alist_strm || {})[0];

if (alistStrmConfig && alistStrmConfig.apiKey && alistStrmConfig.address && alistStrmTasks.length > 0) {
    logger.info('Alist-Strm任务配置信息', {
        tasks: alistStrmTasks.map(task => ({
            config_id: task.configId,
            api_url: `${alistStrmConfig.address}/api/run_config/${task.configId}`,
            delay_time: task.delayTime || 0
        }))
    });
} else {
    logger.info('未找到有效的Alist-Strm任务配置');
}