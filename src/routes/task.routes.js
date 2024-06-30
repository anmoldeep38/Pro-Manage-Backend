import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { changeTaskStatus, createTask, deleteTask, editTask, getOverdueTasksCount, getTaskById, getTasks, getTasksByPriority, getTasksByStatus, toggleChecklistItem } from '../controllers/task.controller.js'

const router = Router()

router.post('/newTask', verifyJWT, createTask)
router.patch('/editTask/:taskId', verifyJWT, editTask)
router.delete('/deleteTask/:taskId', verifyJWT, deleteTask)
router.patch('/toggleCheck/:taskId/:checklistId', verifyJWT, toggleChecklistItem)
router.patch('/change-status/:taskId', verifyJWT, changeTaskStatus)
router.get('/sort', verifyJWT, getTasks)
router.get('/status', verifyJWT, getTasksByStatus)
router.get('/priority', verifyJWT, getTasksByPriority)
router.get('/:taskId', getTaskById)
router.get('/all/dueTasks', verifyJWT, getOverdueTasksCount)

export default router;