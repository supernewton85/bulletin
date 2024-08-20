const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(db, logger) {
    const router = express.Router();

    // 게시물 작성
    router.post('/', async (req, res) => {
        try {
            const { author, password, content, timestamp, boardId, securitiesId } = req.body;
            if (!author || !content || !boardId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const post = { 
                author, 
                password, 
                content, 
                timestamp, 
                boardId,
                securitiesId,
                createdAt: new Date()
            };
            const result = await db.collection('posts').insertOne(post);
            logger.info(`New post created with ID: ${result.insertedId}`);
            res.status(201).json({ id: result.insertedId, ...post });
        } catch (err) {
            logger.error('Error inserting post:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // 게시물 조회
    router.get('/', async (req, res) => {
        try {
            const { boardId, securitiesId } = req.query;
            let query = {};
            if (boardId) query.boardId = boardId;
            if (securitiesId) query.securitiesId = securitiesId;
            const results = await db.collection('posts').find(query).sort({ timestamp: -1 }).toArray();
            res.json(results);
        } catch (err) {
            logger.error('Error fetching posts:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // 게시물 수정
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { content, updateTime, password } = req.body;
            const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            if (post.password !== password && password !== process.env.ADMIN_PASSWORD) {
                return res.status(403).json({ error: 'Invalid password' });
            }
            const result = await db.collection('posts').updateOne(
                { _id: new ObjectId(id) },
                { $set: { content, updateTime } }
            );
            logger.info(`Post updated with ID: ${id}`);
            res.json({ id, content, updateTime });
        } catch (err) {
            logger.error('Error updating post:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    // 게시물 삭제
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { password } = req.body;
            logger.info(`Attempting to delete post with ID: ${id}`);
            
            if (!id || !ObjectId.isValid(id)) {
                logger.error(`Invalid ObjectId: ${id}`);
                return res.status(400).json({ error: 'Invalid post ID' });
            }

            const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
            if (!post) {
                logger.warn(`Post not found with ID: ${id}`);
                return res.status(404).json({ error: 'Post not found' });
            }

            if (post.password !== password && password !== process.env.ADMIN_PASSWORD) {
                return res.status(403).json({ error: 'Invalid password' });
            }

            const result = await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
            logger.info(`Post deleted with ID: ${id}`);
            res.json({ id });
        } catch (err) {
            logger.error('Error deleting post:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        }
    });

    return router;
};
