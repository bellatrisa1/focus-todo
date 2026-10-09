'use client';
import { create } from 'zustand';
import { storedTodosSchema, todoInputSchema } from '../schemas/todo';
import type { Todo, TodoInput, Filter, Sort } from '../types/todo';
export const STORAGE_KEY = 'focus-todos-v1';
type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>;
interface TodoState {
  todos: Todo[];
  filter: Filter;
  searchQuery: string;
  sort: Sort;
  hydrated: boolean;
  storageError: string | null;
  undoTodos: Todo[] | null;
  undo: () => void;
  importTodos: (raw: string) => number;
  sync: () => void;
  toggleStar: (id: string) => void;
  toggleSubtask: (id: string, subtaskId: string) => void;
  hydrate: () => void;
  addTodo: (input: TodoInput) => void;
  updateTodo: (id: string, input: TodoInput) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  clearCompleted: () => void;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  setSort: (sort: Sort) => void;
}
export const createTodoStore = (
  getStorage: () => StorageAdapter = () => window.localStorage,
) =>
  create<TodoState>((set, get) => {
    let canPersist = false;
    const commit = (todos: Todo[], remember = false) => {
      if (!get().hydrated) return;
      let storageError = get().storageError;
      if (canPersist) {
        try {
          getStorage().setItem(
            STORAGE_KEY,
            JSON.stringify({ version: 1, todos }),
          );
          storageError = null;
        } catch {
          storageError =
            'Не удалось сохранить изменения. Они доступны только до перезагрузки страницы.';
        }
      }
      set({
        todos,
        storageError,
        ...(remember ? { undoTodos: get().todos } : {}),
      });
    };
    return {
      todos: [],
      filter: 'all',
      searchQuery: '',
      sort: 'newest',
      hydrated: false,
      storageError: null,
      undoTodos: null,
      undo: () => {
        const previous = get().undoTodos;
        if (previous) {
          const current = get().todos;
          const ids = new Set(current.map((todo) => todo.id));
          commit([...current, ...previous.filter((todo) => !ids.has(todo.id))]);
          set({ undoTodos: null });
        }
      },
      importTodos: (raw) => {
        if (!get().hydrated || !canPersist)
          throw new Error('Сначала восстановите доступ к хранилищу.');
        const imported = storedTodosSchema.parse(JSON.parse(raw)).todos;
        const existing = new Set(get().todos.map((todo) => todo.id));
        const unique = imported.filter((todo) => {
          if (existing.has(todo.id)) return false;
          existing.add(todo.id);
          return true;
        });
        commit([...get().todos, ...unique]);
        return unique.length;
      },
      sync: () => {
        if (!get().hydrated || !canPersist) return;
        try {
          const raw = getStorage().getItem(STORAGE_KEY);
          const todos =
            raw === null ? [] : storedTodosSchema.parse(JSON.parse(raw)).todos;
          set({ todos, undoTodos: null, storageError: null });
        } catch {
          canPersist = false;
          set({
            storageError:
              'Данные в другой вкладке недоступны или повреждены. Работаем в памяти; хранилище не перезаписывается.',
          });
        }
      },
      toggleStar: (id) =>
        commit(
          get().todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  starred: !todo.starred,
                  updatedAt: new Date().toISOString(),
                }
              : todo,
          ),
        ),
      toggleSubtask: (id, subtaskId) =>
        commit(
          get().todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  updatedAt: new Date().toISOString(),
                  subtasks: todo.subtasks?.map((step) =>
                    step.id === subtaskId
                      ? { ...step, completed: !step.completed }
                      : step,
                  ),
                }
              : todo,
          ),
        ),
      hydrate: () => {
        if (get().hydrated) return;
        try {
          const raw = getStorage().getItem(STORAGE_KEY);
          const todos =
            raw === null ? [] : storedTodosSchema.parse(JSON.parse(raw)).todos;
          canPersist = true;
          set({ todos, hydrated: true });
        } catch {
          set({
            hydrated: true,
            storageError:
              'Хранилище недоступно или данные повреждены. Работаем в памяти; исходные данные не перезаписываются.',
          });
        }
      },
      addTodo: (input) => {
        const data = todoInputSchema.parse(input);
        const now = new Date().toISOString();
        commit([
          ...get().todos,
          {
            ...data,
            id: crypto.randomUUID(),
            completed: false,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      },
      updateTodo: (id, input) => {
        const data = todoInputSchema.parse(input);
        commit(
          get().todos.map((todo) =>
            todo.id === id
              ? { ...todo, ...data, updatedAt: new Date().toISOString() }
              : todo,
          ),
        );
      },
      deleteTodo: (id) =>
        commit(
          get().todos.filter((todo) => todo.id !== id),
          true,
        ),
      toggleTodo: (id) =>
        commit(
          get().todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  completed: !todo.completed,
                  updatedAt: new Date().toISOString(),
                }
              : todo,
          ),
        ),
      clearCompleted: () =>
        commit(
          get().todos.filter((todo) => !todo.completed),
          true,
        ),
      setFilter: (filter) => set({ filter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSort: (sort) => set({ sort }),
    };
  });
export const useTodoStore = createTodoStore();
