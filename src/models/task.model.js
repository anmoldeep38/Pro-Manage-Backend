import { Schema, model } from "mongoose";

const checklistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
})
const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['high', 'moderate', 'low']
    },
    checklists: [checklistSchema],
    dueDate: {
        type: Date,
        required: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['backlog', 'todo', 'progress', 'done'],
        default: 'todo'
    }
}, {
    timestamps: true
});

const Task = model("Task", taskSchema);

export default Task;
