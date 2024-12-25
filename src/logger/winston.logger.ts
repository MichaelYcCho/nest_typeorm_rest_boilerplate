import { utilities, WinstonModule } from 'nest-winston';
import winstonDaily from 'winston-daily-rotate-file';
import * as winston from 'winston';
import { IGNORE_PATTERNS } from '@core/utils/constant';

const logDir = process.env.LOG_DIR || '../logs';

const ignoreFilter = winston.format(
  (info: winston.Logform.TransformableInfo, opts: { ignorePatterns?: string[] }) => {
    if (opts && opts.ignorePatterns) {
      for (const pattern of opts.ignorePatterns) {
        if (typeof info.message === 'string' && info.message.includes(pattern)) {
          return false; // ignored include pattern
        }
      }
    }
    return info;
  },
);

const createDailyLogFile = (level: string): winstonDaily.DailyRotateFileTransportOptions => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.json(),
    ),
    dirname: `${logDir}/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: 30,
    zippedArchive: true,
  };
};

const color = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(color);

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'dev' ? 'silly' : 'info',
      format: winston.format.combine(
        ignoreFilter({ ignorePatterns: IGNORE_PATTERNS }),
        winston.format.colorize({ all: true }),
        winston.format.timestamp(),
        utilities.format.nestLike('Winston', {
          prettyPrint: true,
        }),
      ),
    }),
    new winstonDaily(createDailyLogFile('error')),
    new winstonDaily(createDailyLogFile('warn')),
    new winstonDaily(createDailyLogFile('info')),
  ],
});