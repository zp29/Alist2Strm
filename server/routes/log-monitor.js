const express = require('express');
const router = express.Router();
const {
    getLogMonitorConfigs,
    createLogMonitorConfig,
    updateLogMonitorStatus,
    deleteLogMonitorConfig,
    updateLogMonitorConfig,
    getLogContent
} = require('../log-monitor-api');

// 获取所有日志监控配置
router.get('/', (req, res) => {
    try {
        const configs = getLogMonitorConfigs();
        res.json(configs);
    } catch (error) {
        console.error('获取监控配置失败:', error);
        res.status(500).json({ error: '获取监控配置失败' });
    }
});

// 创建新的日志监控配置
router.post('/', (req, res) => {
    try {
        const { logPath } = req.body;
        if (!logPath) {
            return res.status(400).json({ error: '日志路径不能为空' });
        }
        const newConfig = createLogMonitorConfig(logPath);
        res.status(201).json(newConfig);
    } catch (error) {
        console.error('创建监控配置失败:', error);
        res.status(500).json({ error: '创建监控配置失败' });
    }
});

// 更新日志监控配置状态
router.put('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: '状态不能为空' });
        }
        const updatedConfig = updateLogMonitorStatus(id, status);
        if (!updatedConfig) {
            return res.status(404).json({ error: '未找到指定的监控配置' });
        }
        res.json(updatedConfig);
    } catch (error) {
        console.error('更新监控配置状态失败:', error);
        res.status(500).json({ error: '更新监控配置状态失败' });
    }
});

// 更新日志监控配置
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { logPath } = req.body;
        if (!logPath) {
            return res.status(400).json({ error: '日志路径不能为空' });
        }
        const updatedConfig = updateLogMonitorConfig(id, logPath);
        if (!updatedConfig) {
            return res.status(404).json({ error: '未找到指定的监控配置' });
        }
        res.json(updatedConfig);
    } catch (error) {
        console.error('更新监控配置失败:', error);
        res.status(500).json({ error: '更新监控配置失败' });
    }
});

// 删除日志监控配置
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        deleteLogMonitorConfig(id);
        res.status(204).send();
    } catch (error) {
        console.error('删除监控配置失败:', error);
        res.status(500).json({ error: '删除监控配置失败' });
    }
});

// 获取日志内容
router.get('/log', (req, res) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ error: '日志路径不能为空' });
        }
        const content = getLogContent(path);
        res.send(content);
    } catch (error) {
        console.error('获取日志内容失败:', error);
        // 根据具体错误类型返回相应的错误信息
        if (error.message === '日志文件不存在') {
            return res.status(404).json({ error: '日志文件不存在' });
        } else if (error.message === '指定路径不是文件') {
            return res.status(400).json({ error: '指定路径不是文件' });
        }
        res.status(500).json({ error: error.message || '获取日志内容失败' });
    }
});

module.exports = router;