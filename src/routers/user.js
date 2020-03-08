const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const User = require('../models/user');
const sharp = require('sharp');

const jwt = require('jsonwebtoken');

// SignUp Route
router.post('/users', async (request, response) => {
    const user = new User(request.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        response.status(201).send({ user, token });
    } catch (err) {
        response.status(400).send(err);
    }
});


// Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
});


router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }

});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged out all devices');
    } catch (error) {
        res.status(500).send();
    }
});


router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send('Not valid field provided, Update failed');
    }
    try {
        updates.forEach(update => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        // Bypasses middleware & operates directly on MongoDB
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // });
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

const upload = multer({
    limits: {
        fileSize: 1e6,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Uploading File must be a .png or .jpg or .jpeg'));
        }
        cb(undefined, true);
        // cb(new Error('Error Message'))
        // cb(undefined, true) ---> Success
        // cb(undefined, false) ---> Silently reject
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Deleted the avatar');
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('Not Found');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send('Image not found');
    }
});

module.exports = router;