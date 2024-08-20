const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(db, logger) {
    const router = express.Router();

    // Issue News 작성/수정
    router.post('/', async (req, res) => {
        try {
            const { id, issuer, maturity, issueRate, prevRate, expectedSpread, issueAmount, status, password } = req.body;
            if (!issuer || !maturity || !issueRate || !prevRate || !status) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const issueNews = {
                issuer,
                maturity,
                issueRate,
                prevRate,
                expectedSpread,
                issueAmount,
                status,
                password,
                updateTime: new Date()
            };
            let result;
            if (id) {
                // 수정
                result = await db.collection('issueNews').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: issueNews }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Issue News not found' });
                }
            } else {
                // 새로 작성
                result = await db.collection('issueNews').insertOne(issueNews);
            }
            logger.info(`Issue News ${id ? 'updated' : 'created'} with ID: ${id || result.insertedId}`);
            res.status(201).json({ id: id || result.insertedId, ...issueNews });
        } catch (err) {
            logger.error('Error saving Issue News:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Issue News 조회
    router.get('/', async (req, res) => {
        try {
            const results = await db.collection('issueNews').find().sort({ updateTime: -1 }).toArray();
            res.json(results);
        } catch (err) {
            logger.error('Error fetching Issue News:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Issue News 삭제
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { password } = req.body;
            logger.info(`Attempting to delete Issue News with ID: ${id}`);
            
            if (!id || !ObjectId.isValid(id)) {
                logger.error(`Invalid ObjectId: ${id}`);
                return res.status(400).json({ error: 'Invalid Issue News ID' });
            }

            const issueNews = await db.collection('issueNews').findOne({ _id: new ObjectId(id) });
            if (!issueNews) {
                logger.warn(`Issue News not found with ID: ${id}`);
                return res.status(404).json({ error: 'Issue News not found' });
            }

            if (issueNews.password !== password && password !== process.env.ADMIN_PASSWORD) {
                return res.status(403).json({ error: 'Invalid password' });
            }

            const result = await db.collection('issueNews').deleteOne({ _id: new ObjectId(id) });
            logger.info(`Issue News deleted with ID: ${id}`);
            res.json({ id });
        } catch (err) {
            logger.error('Error deleting Issue News:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    return router;
};