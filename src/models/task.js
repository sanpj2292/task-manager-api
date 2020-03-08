const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Provide owner for the task'],
        ref: 'users'
    }
}, { timestamps: true });

const Task = mongoose.model('tasks', TaskSchema);

module.exports = Task;