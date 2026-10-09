import type { z } from 'zod';
import type { todoInputSchema, todoSchema } from '../schemas/todo';
export type Todo = z.infer<typeof todoSchema>;
export type TodoInput = z.infer<typeof todoInputSchema>;
export type Filter =
  'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue' | 'starred';
export type Sort =
  'newest' | 'oldest' | 'alphabetical' | 'priority' | 'dueDate';
