const winston = require('winston');
const path = require('path');

// 创建日志目录的函数
const createLogger = (filename) => {
    const logDir = path.join(__dirname, 'logs');
    const logFileName = path.basename(filename, '.js');
    const logPath = path.join(logDir, `${logFileName}.log`);

    // 创建logger实例
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: () => {
                    const date = new Date();
                    date.setHours(date.getHours() + 8);
                    return date.toISOString();
                }
            }),
            winston.format.printf(({ timestamp, level, message, ...rest }) => {
                const data = { ...rest };
                delete data.timestamp;
                delete data.level;
                // 如果data中有其他属性，将其转换为JSON字符串
                const extraData = Object.keys(data).length > 0 ? `: ${JSON.stringify(data)}` : '';
                return `${timestamp} [${level}] ${message}${extraData}`;
            })
        ),
        transports: [
            new winston.transports.File({
                filename: logPath,
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true
            }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ]
    });

    return logger;
};

module.exports = createLogger;