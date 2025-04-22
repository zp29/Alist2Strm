const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '../data/config.json');

// 读取配置文件
function readConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return config.alist || {};
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return {};
  }
}

// 写入配置文件
function writeConfig(alistStrmConfig) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config.alist = alistStrmConfig;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('写入配置文件失败:', error);
    return false;
  }
}

// 获取所有配置
router.get('/', (req, res) => {
  const config = readConfig();
  res.json(config);
});

// 创建新配置
router.post('/', (req, res) => {
  const { address, apiKey } = req.body;
  
  if (!address || !apiKey) {
    return res.status(400).json({ error: '地址和API Key都是必填项' });
  }

  const config = readConfig();
  const newConfig = {
    id: Date.now().toString(),
    createTime: new Date().toISOString(),
    address,
    apiKey
  };

  config[newConfig.id] = newConfig;
  
  if (writeConfig(config)) {
    res.json(newConfig);
  } else {
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 删除配置
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const config = readConfig();

  if (!config[id]) {
    return res.status(404).json({ error: '配置不存在' });
  }

  delete config[id];

  if (writeConfig(config)) {
    res.json({ message: '删除成功' });
  } else {
    res.status(500).json({ error: '删除配置失败' });
  }
});

// 更新配置
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { address, apiKey } = req.body;
  
  if (!address || !apiKey) {
    return res.status(400).json({ error: '地址和API Key都是必填项' });
  }

  const config = readConfig();
  
  if (!config[id]) {
    return res.status(404).json({ error: '配置不存在' });
  }

  config[id] = {
    ...config[id],
    address,
    apiKey
  };

  if (writeConfig(config)) {
    res.json(config[id]);
  } else {
    res.status(500).json({ error: '更新配置失败' });
  }
});

module.exports = router;