const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name field for a user is required'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email field for a user is required'],
        trim: true,
        validate(val) {
            if (!validator.isEmail(val)) {
                throw new Error('The email provided is invalid');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate: (val) => {
            if (val < 0) {
                throw new Error('Age must be a positive number');
            }
        }
    },
    password: {
        type: String,
        minlength: 6,
        trim: true,
        validate(val) {
            if (val.toLowerCase().includes('password')) {
                throw new Error('Password not secure')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// Accessible on Model
UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('No Error with this E-mail found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid Credentials');
    }
    return user;
};

// Hash plain text password before save
UserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    // Used to indicate that this function ends
    next();
});

// Delete all the tasks when user is deleted
UserSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

UserSchema.virtual('tasks', {
    ref: 'tasks',
    localField: '_id',
    foreignField: 'owner'
});

// These are accessible on Instances of collections
UserSchema.methods.generateAuthToken = async function (next) {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save()
    return token;
};

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
};

const User = mongoose.model('users', UserSchema);

module.exports = User;