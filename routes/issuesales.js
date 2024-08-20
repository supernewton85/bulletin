const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(db, logger) {
    const router = express.Router();

    // Issue Sales 작성/수정
    router.post('/', async (req, res) => {
        try {
            const { id, issuer, maturity, issueRate, prevRate, expectedSpread, issueAmount, status, password, boardId } = req.body;
            if (!issuer || !maturity || !issueRate || !prevRate || !status || !boardId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const issueSales = {
                issuer,
                maturity,
                issueRate,
                prevRate,
                expectedSpread,
                issueAmount,
                status,
                password,
                boardId,
                updateTime: new Date()
            };
            let result;
            if (id) {
                // 수정
                result = await db.collection('issueSales').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: issueSales }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Issue Sales not found' });
                }
            } else {
                // 새로 작성
                result = await db.collection('issueSales').insertOne(issueSales);
            }
            logger.info(`Issue Sales ${id ? 'updated' : 'created'} with ID: ${id || result.insertedId}`);
            res.status(201).json({ id: id || result.insertedId, ...issueSales });
        } catch (err) {
            logger.error('Error saving Issue Sales:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Issue Sales 조회
    router.get('/', async (req, res) => {
        try {
            const { boardId } = req.query;
            let query = {};
            if (boardId) query.boardId = boardId;
            const results = await db.collection('issueSales').find(query).sort({ updateTime: -1 }).toArray();
            res.json(results);
        } catch (err) {
            logger.error('Error fetching Issue Sales:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Issue Sales 삭제
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { password } = req.body;
            logger.info(`Attempting to delete Issue Sales with ID: ${id}`);
            
            if (!id || !ObjectId.isValid(id)) {
                logger.error(`Invalid ObjectId: ${id}`);
                return res.status(400).json({ error: 'Invalid Issue Sales ID' });
            }

            const issueSales = await db.collection('issueSales').findOne({ _id: new ObjectId(id) });
            if (!issueSales) {
                logger.warn(`Issue Sales not found with ID: ${id}`);
                return res.status(404).json({ error: 'Issue Sales not found' });
            }

            if (issueSales.password !== password && password !== process.env.ADMIN_PASSWORD) {
                return res.status(403).json({ error: 'Invalid password' });
            }

            const result = await db.collection('issueSales').deleteOne({ _id: new ObjectId(id) });
            logger.info(`Issue Sales deleted with ID: ${id}`);
            res.json({ id });
        } catch (err) {
            logger.error('Error deleting Issue Sales:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    return router;
};