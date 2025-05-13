const express = require('express');
const router = express.Router();
const { testApiKey } = require('../middleware/apiKeyAuth');

// API令牌测试端点
router.get('/test-api-key', (req, res) => {
  testApiKey(req, res);
});

// 导出路由对象
module.exports = router;