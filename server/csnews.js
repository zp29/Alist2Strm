const express = require('express');
const router = express.Router();
const createLogger = require('./logger');
const { apiKeyAuth } = require('./middleware/apiKeyAuth');

// 创建日志记录器
const logger = createLogger(__filename);

// 处理POST请求的路由，添加API令牌验证中间件
router.post('/', apiKeyAuth, (req, res) => {
    const timestamp = new Date().toISOString();
    // 使用logger记录请求信息
    logger.info('收到CS请求', req.body);

    res.json({ message: '请求已记录' });
});

module.exports = router;