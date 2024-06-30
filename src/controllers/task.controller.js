import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from '../utils/error.js'
import { apiResponse } from '../utils/apiResponse.js'
import Task from "../models/task.model.js";
import mongoose from 'mongoose'
import moment from 'moment'


export const createTask = asyncHandler(async (req, res) => {
    const { title, priority, checklists, dueDate } = req.body;

    if (!title) {
        throw new apiError(400, "Title is required");
    }
    if (!priority) {
        throw new apiError(400, "Priority is required");
    }
    if (!checklists || !Array.isArray(checklists) || checklists.length === 0) {
        throw new apiError(400, "At least one checklist item is required");
    }

    for (let i = 0; i < checklists.length; i++) {
        const checklist = checklists[i].name.trim();
        if (!checklist) {
            throw new apiError(400, `Checklist ${i + 1} name is required`)
        }
    }

    let formattedDueDate;
    if (dueDate) {
        const parts = dueDate.split("/");
        formattedDueDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }

    const task = new Task({
        title,
        priority,
        checklists,
        dueDate: formattedDueDate,
        createdBy: req.user?._id
    });

    const newTask = await task.save();
    res.status(201).json(new apiResponse(201, newTask, "Task created successfully"));
})

export const editTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, priority, checklists, dueDate } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new apiError(404, "Task not found");
    }

    if (task.createdBy.toString() !== req.user?._id.toString()) {
        throw new apiError(403, "User not authorized to edit this task");
    }

    if (checklists && (!Array.isArray(checklists) || checklists.length === 0)) {
        throw new apiError(400, "At least one checklist item is required");
    }

    if (title) {
        task.title = title;
    }
    if (priority) {
        task.priority = priority;
    }
    if (checklists) {
        task.checklists = checklists;
    }

    if (dueDate) {
        const parts = dueDate.split("/");
        task.dueDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }

    const updatedTask = await task.save();
    res.status(200).json(new apiResponse(200, updatedTask, "Task updated successfully"));
})

export const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new apiError(404, "Task not found");
    }

    if (task.createdBy.toString() !== req.user?._id.toString()) {
        throw new apiError(403, "User not authorized to delete this task");
    }

    await Task.findByIdAndDelete(taskId);
    res.status(200).json(new apiResponse(200, {}, "Task deleted successfully"));
})

export const toggleChecklistItem = asyncHandler(async (req, res) => {
    const { taskId, checklistId } = req.params;
    const { isCompleted } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new apiError(404, "Task not found");
    }

    if (task.createdBy.toString() !== req.user?._id.toString()) {
        throw new apiError(403, "User not authorized to update this task");
    }

    const checklistItemIndex = task.checklists.findIndex(item =>
        item._id.equals(new mongoose.Types.ObjectId(checklistId))
    );

    if (checklistItemIndex === -1) {
        throw new apiError(404, "Checklist item not found");
    }

    task.checklists[checklistItemIndex].isCompleted = isCompleted;

    const updatedTask = await task.save();
    res.status(200).json(new apiResponse(200, updatedTask, "Checklist item updated successfully"));
})

export const changeTaskStatus = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { fromStatus, toStatus } = req.body;

    if (!fromStatus || !toStatus) {
        throw new apiError(400, "Status is required");
    }

    if (fromStatus === toStatus) {
        throw new apiError(400, "Status must be different");
    }

    const task = await Task.findById(taskId);
    if (!task) {
        throw new apiError(404, 'Task not found');
    }

    if (task.createdBy.toString() !== req.user?._id.toString()) {
        throw new apiError(403, "User not authorized to edit this task");
    }

    task.status = toStatus;

    const updatedTask = await task.save();

    res.status(200).json(new apiResponse(200, updatedTask, 'Task status updated successfully'));
})

export const getTasks = asyncHandler(async (req, res) => {
    const { timeFrame } = req.query;

    let startDate, endDate;
    switch (timeFrame) {
        case 'today':
            startDate = moment().startOf('day');
            endDate = moment().endOf('day');
            break;
        case 'week':
            startDate = moment().startOf('isoWeek');
            endDate = moment().endOf('isoWeek');
            break;
        case 'month':
            startDate = moment().startOf('month');
            endDate = moment().endOf('month');
            break;
        default:
            return res.status(400).json(new apiResponse(400, null, 'Valid options are today, week, or month.'));
    }

    const tasks = await Task.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                },
                createdBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $project: {
                title: 1,
                priority: 1,
                checklists: 1,
                dueDate: 1,
                createdBy: 1,
                status: 1,
                createdAt: 1
            }
        }
    ]);

    res.status(200).json(new apiResponse(200, tasks, 'Tasks fatched successfully'));
})

export const getTasksByStatus = asyncHandler(async (req, res) => {

    const { status } = req.query

    const tasks = await Task.aggregate([
        {
            $match: {
                status: status,
                createdBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: '$status',
                totalTask: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalTask: 1
            }
        }
    ])

    if (tasks.length === 0) {
        res.status(200).json(new apiResponse(200, { totalTask: 0 }, `No tasks found`));
    } else {
        res.status(200).json(new apiResponse(200, tasks[0], `Tasks fetched successfully`));
    }
})

export const getTasksByPriority = asyncHandler(async (req, res) => {

    const { priority } = req.query

    const tasks = await Task.aggregate([
        {
            $match: {
                priority: priority,
                createdBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: '$priority',
                totalTask: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalTask: 1
            }
        }
    ])

    if (tasks.length === 0) {
        res.status(200).json(new apiResponse(200, { totalTask: 0 }, `No tasks found`));
    } else {
        res.status(200).json(new apiResponse(200, tasks[0], `Tasks fetched successfully`));
    }
})

export const getOverdueTasksCount = asyncHandler(async (req, res) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const tasks = await Task.aggregate([
        {
            $match: {
                dueDate: { $lt: currentDate },
                status: { $ne: 'done' },
                createdBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $count: "overdueTasks"
        }
    ]);

    if (tasks.length === 0) {
        res.status(200).json(new apiResponse(200, { overdueTasks: 0 }, `No tasks found`));
    } else {
        res.status(200).json(new apiResponse(200, tasks[0], `Tasks fetched successfully`));
    }
})

export const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) {
        throw new apiError(400, 'Task id is required')
    }

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId)
            }
        }
    ])

    if (task.length === 0) {
        throw new apiError(404, 'No task found')
    }

    res.status(200).json(
        new apiResponse(200, task[0], 'Task fatched successfully')
    )
})