const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 로거 설정
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB 연결 설정
const url = process.env.MONGODB_URI;
const dbName = 'Cluster0'; // 여기에 실제 데이터베이스 이름을 입력하세요

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url);
    logger.info('Connected to MongoDB');
    db = client.db(dbName);
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

// 데이터베이스 연결 확인 미들웨어
app.use((req, res, next) => {
    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
    }
    next();
});

// 에러 처리 미들웨어
const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
};

// 라우터 설정
const postsRouter = require('./routes/posts')(db, logger);
const issueNewsRouter = require('./routes/issuenews')(db, logger);
const issueSalesRouter = require('./routes/issuesales')(db, logger);
const pollsRouter = require('./routes/polls')(db, logger);

app.use('/posts', postsRouter);
app.use('/issue-news', issueNewsRouter);
app.use('/issue-sales', issueSalesRouter);
app.use('/polls', pollsRouter);

// SPA를 위한 라우팅
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

// 서버 시작
async function startServer() {
    await connectToDatabase();
    app.listen(port, '0.0.0.0', () => {
        logger.info(`Server running at http://0.0.0.0:${port}`);
        logger.info(`Public IP: ${process.env.PUBLIC_IP}`);
        logger.info(`Public DNS: ${process.env.PUBLIC_DNS}`);
    });
}

startServer().catch(err => {
    logger.error('Failed to start server:', err);
    process.exit(1);
});