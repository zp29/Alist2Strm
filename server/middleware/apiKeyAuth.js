const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '../data/config.json');

// 读取配置文件中的API令牌
function getApiKey() {
  try {
    let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (config.logMonitorConfigs && Array.isArray(config.logMonitorConfigs)) {
      const activeConfig = config.logMonitorConfigs.find(conf => conf.status === 'active');
      if (activeConfig && activeConfig.api_key) {
        return activeConfig.api_key;
      }
    }
    return '';
  } catch (error) {
    console.error('读取API令牌配置失败:', error);
    return '';
  }
}

// API令牌验证中间件
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'qilinauto-qilinauto-001';

function apiKeyAuth(req, res, next) {
  // 检查是否是登录请求
  if (req.path === '/auth/login') {
    return next();
  }

  // 检查JWT令牌
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      jwt.verify(token, JWT_SECRET);
      return next();
    } catch (error) {
      console.warn('JWT验证失败:', error.message);
      // 继续尝试API令牌验证
    }
  }

  // 检查API令牌
  const apiKey = req.header('ql-api-key');
  const configApiKey = getApiKey();

  if (!configApiKey) {
    console.warn('API令牌未配置');
    return res.status(500).json({ error: 'API令牌未配置' });
  }

  if (!apiKey) {
    return res.status(401).json({ error: '请提供API令牌或进行用户登录' });
  }

  if (apiKey !== configApiKey) {
    return res.status(403).json({ error: 'API令牌无效' });
  }

  next();
}

// API令牌测试函数
function testApiKey(req, res) {
  const apiKey = req.header('ql-api-key');
  const configApiKey = getApiKey();
  const debugInfo = {
    requestInfo: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      timestamp: new Date().toISOString()
    },
    apiKeyStatus: {
      provided: Boolean(apiKey),
      value: apiKey || null,
      configuredInSystem: Boolean(configApiKey),
      isValid: apiKey === configApiKey
    },
    validationResult: {
      success: false,
      message: ''
    }
  };

  // 验证API令牌
  if (!configApiKey) {
    debugInfo.validationResult.message = 'API令牌未在系统中配置';
  } else if (!apiKey) {
    debugInfo.validationResult.message = '请求中未提供API令牌';
  } else if (apiKey !== configApiKey) {
    debugInfo.validationResult.message = 'API令牌无效';
  } else {
    debugInfo.validationResult.success = true;
    debugInfo.validationResult.message = 'API令牌验证成功';
  }

  res.json(debugInfo);
}

module.exports = {
  apiKeyAuth,
  testApiKey
};