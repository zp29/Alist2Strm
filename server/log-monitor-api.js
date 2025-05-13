const fs = require('fs');
const path = require('path');

// 配置文件路径
const configPath = path.join(__dirname, 'data', 'config.json');

// 读取配置文件
function readConfig() {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// 保存配置文件
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}




// 获取所有日志监控配置
function getLogMonitorConfigs() {
    const config = readConfig();
    return config.logMonitorConfigs || [];
}

// 创建新的日志监控配置
function createLogMonitorConfig(api_key) {
    const config = readConfig();
    const newConfig = {
        id: Date.now().toString(),
        createTime: (() => {
            const now = new Date();
            return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        })(), 
        api_key,
        logPath: '/app/server/logs/csnews.log',
        status: 'active'
    };
    
    if (!config.logMonitorConfigs) {
        config.logMonitorConfigs = [];
    }
    
    config.logMonitorConfigs.push(newConfig);
    saveConfig(config);
    return newConfig;
}

// 更新日志监控配置状态
function updateLogMonitorStatus(id, status) {
    const config = readConfig();
    const configIndex = config.logMonitorConfigs.findIndex(c => c.id === id);
    
    if (configIndex !== -1) {
        config.logMonitorConfigs[configIndex].status = status;
        saveConfig(config);
        return config.logMonitorConfigs[configIndex];
    }
    return null;
}

// 删除日志监控配置
function deleteLogMonitorConfig(id) {
    const config = readConfig();
    config.logMonitorConfigs = config.logMonitorConfigs.filter(c => c.id !== id);
    saveConfig(config);
}

// 更新日志监控配置
function updateLogMonitorConfig(id, api_key) {
    const config = readConfig();
    const configIndex = config.logMonitorConfigs.findIndex(c => c.id === id);
    
    if (configIndex !== -1) {
        config.logMonitorConfigs[configIndex].api_key = api_key;
        saveConfig(config);
        return config.logMonitorConfigs[configIndex];
    }
    return null;
}

// 获取API令牌
function getApiKey(id) {
    try {
        const config = readConfig();
        const monitorConfig = config.logMonitorConfigs.find(c => c.id === id);
        
        if (!monitorConfig) {
            console.error('监控配置不存在:', id);
            throw new Error('监控配置不存在');
        }

        if (monitorConfig.status !== 'active') {
            console.error('监控配置未激活:', id);
            throw new Error('监控配置未激活');
        }

        return monitorConfig.api_key;
    } catch (error) {
        console.error('获取API令牌失败:', error);
        throw error; // 向上抛出错误，让路由处理器处理
    }
}
// 获取日志文件内容
function getLogContent(logPath) {
    try {
        // 规范化文件路径
        const normalizedPath = path.normalize(logPath);
        
        if (!fs.existsSync(normalizedPath)) {
            console.error('日志文件不存在:', normalizedPath);
            throw new Error('日志文件不存在');
        }

        // 检查文件状态
        const stats = fs.statSync(normalizedPath);
        if (!stats.isFile()) {
            console.error('指定路径不是文件:', normalizedPath);
            throw new Error('指定路径不是文件');
        }

        // 读取最后1000行日志，并确保获取最新内容
        const content = fs.readFileSync(normalizedPath, {encoding: 'utf8', flag: 'r'});
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.slice(-1000).join('\n');
    } catch (error) {
        console.error('读取日志文件失败:', error);
        throw error; // 向上抛出错误，让路由处理器处理
    }
}

module.exports = {
    getLogMonitorConfigs,
    createLogMonitorConfig,
    updateLogMonitorStatus,
    deleteLogMonitorConfig,
    updateLogMonitorConfig,
    getApiKey,
    getLogContent
};