const express = require('express');
const router = new express.Router();

const auth = require('../middleware/auth');
const Task = require('../models/task');

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send('Not valid field provided, Update failed');
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true,
        //     useFindAndModify: true
        // });
        if (!task) {
            return res.status(404).send('No task available with that id for logged in user');
        }
        updates.forEach(update => task[update] = req.body[update]);
        await task.save()
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/tasks', auth, async (request, response) => {
    try {
        const task = new Task({
            ...request.body,
            owner: request.user._id
        });
        await task.save();
        response.status(201).send(task);
    } catch (e) {
        response.status(400).send(e);
    }
});

// GET /tasks?completed=true
// GET /tasks?limit=3
// GET /tasks?skip=3
// GET /tasks?sortBy=createdAt:asc
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    if (req.query.completed) {
        match.completed = req.query.completed.toLowerCase() === "true";
    }
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        if (parts[0] && parts[1]) {
            sort[parts[0]] = (parts[1] === "desc") ? -1 : 1;
        } else {
            return res.status(400).send('Parameters to sortBy argument should be sent correctly eg: sortBy=columnName:desc or sortBy=columnName:asc');
        }
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/tasks/:id', auth, async (request, response) => {
    try {
        const task = await Task.findOne({
            _id: request.params.id,
            owner: request.user._id
        });
        if (!task) {
            return response.status(404).send('Task created with this id & user not found');
        }
        response.send(task);
    } catch (error) {
        response.status(500).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send('Mentioned Task for logged user is not found');
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;