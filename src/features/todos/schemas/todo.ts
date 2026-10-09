import { z } from 'zod';
export const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  completed: z.boolean(),
});
export const todoInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введите название задачи')
    .max(120, 'Не более 120 символов'),
  description: z.string().trim().max(2000, 'Не более 2000 символов').optional(),
  project: z.string().trim().max(40, 'Не более 40 символов').optional(),
  starred: z.boolean().optional(),
  subtasks: z.array(subtaskSchema).max(30, 'Не более 30 шагов').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.union([z.literal(''), z.iso.date()]).optional(),
});
export const todoSchema = todoInputSchema.extend({
  id: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const storedTodosSchema = z.object({
  version: z.literal(1),
  todos: z.array(todoSchema),
});
