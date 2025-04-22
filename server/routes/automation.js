const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const AUTO_FILE = path.join(__dirname, '../data/auto.json');

// 读取自动化任务数据
function readAutoData() {
  try {
    if (!fs.existsSync(AUTO_FILE)) {
      fs.writeFileSync(AUTO_FILE, JSON.stringify({ automationTasks: [] }));
    }
    const data = fs.readFileSync(AUTO_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取自动化任务数据失败:', error);
    return { automationTasks: [] };
  }
}

// 保存自动化任务数据
function saveAutoData(data) {
  try {
    fs.writeFileSync(AUTO_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('保存自动化任务数据失败:', error);
    throw error;
  }
}

// 获取所有自动化任务
router.get('/', (req, res) => {
  try {
    const data = readAutoData();
    res.json(data.automationTasks);
  } catch (error) {
    res.status(500).json({ error: '获取自动化任务失败' });
  }
});

// 创建自动化任务
router.post('/', (req, res) => {
  const data = readAutoData();
  const { program } = req.body;

  // 检查是否已存在相同类型的自动化任务，但alist任务允许创建多个
  if (program !== 'alist') {
    const existingTask = data.automationTasks.find(t => t.program === program);
    if (existingTask) {
      return res.status(400).json({ error: `请删除原有${program}自动化任务，再操作` });
    }
  }

  try {
    const newTask = {
      id: Date.now().toString(),
      ...req.body
    };
    data.automationTasks.push(newTask);
    saveAutoData(data);

    // 如果是alist-strm任务且状态为active，启动服务
    if (newTask.program === 'alist-strm' && newTask.status === 'active') {
      startAlistStrmApi();
    }

    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: '创建自动化任务失败' });
  }
});

const { spawn } = require('child_process');
let alistStrmProcess = null;
let alistRefreshProcess = null;

// 启动alist-strm-api服务
function startAlistStrmApi() {
  if (!alistStrmProcess) {
    alistStrmProcess = spawn('node', [path.join(__dirname, '..', 'alist-strm-api.js')]);
    console.log('alist-strm-api服务已启动');

    alistStrmProcess.on('error', (error) => {
      console.error('启动alist-strm-api服务失败:', error);
    });

    alistStrmProcess.on('exit', (code) => {
      console.log('alist-strm-api服务已退出，退出码:', code);
      alistStrmProcess = null;
    });
  }
}

// 停止alist-strm-api服务
function stopAlistStrmApi() {
  try {
    const { spawn } = require('child_process');
    spawn('pkill', ['-f', 'node.*alist-strm-api.js']);
    alistStrmProcess = null;
    console.log('alist-strm-api服务已停止');
  } catch (error) {
    console.error('停止alist-strm-api服务失败:', error);
  }
}

// 存储所有alist-refresh进程
const alistRefreshProcesses = new Map();

// 启动alist-refresh服务
function startAlistRefresh(task) {
  const portId = task.portId;
  const processKey = `alist-refresh-${portId}`;
  
  if (!alistRefreshProcesses.has(processKey)) {
    // 复制并重命名alist-refresh.js文件
    const sourceFile = path.join(__dirname, '..', 'alist-refresh.js');
    const targetFile = path.join(__dirname, '..', `alist-refresh-${portId}.js`);
    
    if (!fs.existsSync(targetFile)) {
      const content = fs.readFileSync(sourceFile, 'utf8');
      const updatedContent = content
        .replace(/task\.portId === 1/g, `task.portId === ${portId}`)
        .replace(/port: config\.server\.port \+ 1/g, `port: config.server.port + ${portId}`);
      fs.writeFileSync(targetFile, updatedContent);
    }
    
    const process = spawn('node', [targetFile]);
    alistRefreshProcesses.set(processKey, process);
    console.log(`alist-refresh-${portId}服务已启动`);

    process.on('error', (error) => {
      console.error(`启动alist-refresh-${portId}服务失败:`, error);
    });

    process.on('exit', (code) => {
      console.log(`alist-refresh-${portId}服务已退出，退出码:`, code);
      alistRefreshProcesses.delete(processKey);
      // 删除不再需要的文件
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
      }
    });
  }
}

// 停止alist-refresh服务
function stopAlistRefresh(task) {
  const portId = task.portId;
  const processKey = `alist-refresh-${portId}`;
  
  try {
    const { spawn } = require('child_process');
    spawn('pkill', ['-f', `node.*alist-refresh-${portId}.js`]);
    alistRefreshProcesses.delete(processKey);
    console.log(`alist-refresh-${portId}服务已停止`);
    
    // 删除不再需要的文件
    const targetFile = path.join(__dirname, '..', `alist-refresh-${portId}.js`);
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
  } catch (error) {
    console.error(`停止alist-refresh-${portId}服务失败:`, error);
  }
}

// 更新自动化任务状态
router.put('/:id/status', (req, res) => {
  try {
    const data = readAutoData();
    const task = data.automationTasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: '自动化任务不存在' });
    }
    task.status = req.body.status;
    saveAutoData(data);

    // 根据任务类型和状态控制相应的服务
    if (task.program === 'alist-strm') {
      if (task.status === 'active') {
        startAlistStrmApi();
      } else {
        stopAlistStrmApi();
      }
    } else if (task.program === 'alist') {
      if (task.status === 'active') {
        // 先停止可能存在的旧进程
        stopAlistRefresh(task);
        // 延迟一秒后启动新进程，确保旧进程完全停止
        setTimeout(() => {
          startAlistRefresh(task);
        }, 1000);
      } else {
        stopAlistRefresh(task);
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '更新自动化任务状态失败' });
  }
});

// 更新自动化任务
router.put('/:id', (req, res) => {
  try {
    const data = readAutoData();
    const taskIndex = data.automationTasks.findIndex(t => t.id === req.params.id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: '自动化任务不存在' });
    }

    const { program } = req.body;
    // 检查是否已存在相同类型的自动化任务（除了当前正在编辑的任务），但alist任务允许创建多个
    if (program !== 'alist') {
      const existingTask = data.automationTasks.find(t => t.program === program && t.id !== req.params.id);
      if (existingTask) {
        return res.status(400).json({ error: `已存在${program}自动化任务` });
      }
    }

    // 更新任务信息，保持原有的id和status
    const updatedTask = {
      ...data.automationTasks[taskIndex],
      ...req.body,
      id: req.params.id,
      status: data.automationTasks[taskIndex].status
    };

    data.automationTasks[taskIndex] = updatedTask;
    saveAutoData(data);
    res.json(updatedTask);
  } catch (error) {
    console.error('更新自动化任务失败:', error);
    res.status(500).json({ error: '更新自动化任务失败' });
  }
});

// 删除自动化任务
router.delete('/:id', (req, res) => {
  try {
    const data = readAutoData();
    const index = data.automationTasks.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '自动化任务不存在' });
    }
    data.automationTasks.splice(index, 1);
    saveAutoData(data);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除自动化任务失败' });
  }
});

module.exports = router;