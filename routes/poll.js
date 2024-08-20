const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(db, logger) {
    const router = express.Router();

    // Poll 생성
    router.post('/', async (req, res) => {
        try {
            const { question, options, isSubjective } = req.body;
            if (!question || (!isSubjective && (!options || options.length < 2))) {
                return res.status(400).json({ error: 'Invalid poll data' });
            }
            const poll = {
                question,
                options: isSubjective ? [] : options.map(option => ({ text: option, votes: 0 })),
                isSubjective,
                answers: isSubjective ? [] : null,
                createdAt: new Date()
            };
            const result = await db.collection('polls').insertOne(poll);
            logger.info(`New poll created with ID: ${result.insertedId}`);
            res.status(201).json({ id: result.insertedId, ...poll });
        } catch (err) {
            logger.error('Error creating poll:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // Poll 조회
    router.get('/', async (req, res) => {
        try {
            const results = await db.collection('polls').find().sort({ createdAt: -1 }).toArray();
            res.json(results);
        } catch (err) {
            logger.error('Error fetching polls:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // 투표
    router.post('/:id/vote', async (req, res) => {
        try {
            const { id } = req.params;
            const { optionIndex, answer } = req.body;
            
            const poll = await db.collection('polls').findOne({ _id: new ObjectId(id) });
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }

            let result;
            if (poll.isSubjective) {
                // 주관식 투표 처리
                result = await db.collection('polls').updateOne(
                    { _id: new ObjectId(id) },
                    { $push: { answers: answer } }
                );
            } else {
                // 객관식 투표 처리
                if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
                    return res.status(400).json({ error: 'Invalid option index' });
                }
                result = await db.collection('polls').updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { [`options.${optionIndex}.votes`]: 1 } }
                );
            }

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: 'Failed to update poll' });
            }

            logger.info(`Vote recorded for poll ${id}`);
            const updatedPoll = await db.collection('polls').findOne({ _id: new ObjectId(id) });
            res.json(updatedPoll);
        } catch (err) {
            logger.error('Error recording vote:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    return router;
};