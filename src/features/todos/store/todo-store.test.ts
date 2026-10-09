import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTodoStore, STORAGE_KEY } from './todo-store';
import { selectTodos } from '@/lib/todos';
import { todoInputSchema } from '../schemas/todo';
const input = {
  title: 'Задача',
  description: 'Описание',
  priority: 'medium' as const,
  dueDate: '2026-12-31',
};
function setup(raw: string | null = null) {
  const memory = new Map<string, string>();
  if (raw !== null) memory.set(STORAGE_KEY, raw);
  const storage = {
    getItem: vi.fn((key: string) => memory.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      memory.set(key, value);
    }),
  };
  const store = createTodoStore(() => storage);
  store.getState().hydrate();
  return { store, storage };
}
beforeEach(() => {
  vi.useRealTimers();
});
describe('Todo store', () => {
  it('adds a validated task and persists it', () => {
    const { store, storage } = setup();
    store.getState().addTodo({ ...input, title: '  Задача  ' });
    expect(store.getState().todos[0]).toMatchObject({
      ...input,
      completed: false,
    });
    expect(store.getState().todos[0].id).toBeTruthy();
    expect(storage.setItem).toHaveBeenCalledOnce();
  });
  it('updates content, preserving identity and creation date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01'));
    const { store } = setup();
    store.getState().addTodo(input);
    const original = store.getState().todos[0];
    vi.setSystemTime(new Date('2026-01-02'));
    store
      .getState()
      .updateTodo(original.id, { ...input, title: 'Изменено', dueDate: '' });
    expect(store.getState().todos[0]).toMatchObject({
      id: original.id,
      createdAt: original.createdAt,
      title: 'Изменено',
      dueDate: '',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });
  it('deletes only the selected task', () => {
    const { store } = setup();
    store.getState().addTodo(input);
    store.getState().addTodo(input);
    const id = store.getState().todos[0].id;
    store.getState().deleteTodo(id);
    expect(store.getState().todos).toHaveLength(1);
    expect(store.getState().todos[0].id).not.toBe(id);
  });
  it('toggles complete and active', () => {
    const { store } = setup();
    store.getState().addTodo(input);
    const id = store.getState().todos[0].id;
    store.getState().toggleTodo(id);
    expect(store.getState().todos[0].completed).toBe(true);
    store.getState().toggleTodo(id);
    expect(store.getState().todos[0].completed).toBe(false);
  });
  it('clears completed while preserving active tasks', () => {
    const { store } = setup();
    store.getState().addTodo(input);
    store.getState().addTodo(input);
    store.getState().toggleTodo(store.getState().todos[0].id);
    const active = store.getState().todos[1];
    store.getState().clearCompleted();
    expect(store.getState().todos).toEqual([active]);
  });
  it('restores saved tasks without writing on hydrate', () => {
    const first = setup();
    first.store.getState().addTodo(input);
    const { store, storage } = setup(first.storage.setItem.mock.calls[0][1]);
    expect(store.getState().todos).toEqual(first.store.getState().todos);
    store.getState().hydrate();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('blocks mutations before hydration', () => {
    const store = createTodoStore();
    store.getState().addTodo(input);
    expect(store.getState().todos).toEqual([]);
  });
  it('preserves corrupt storage and permits in-memory work', () => {
    const { store, storage } = setup('{broken');
    store.getState().addTodo(input);
    expect(store.getState().todos).toHaveLength(1);
    expect(store.getState().storageError).toBeTruthy();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('survives inaccessible storage', () => {
    const store = createTodoStore(() => {
      throw new Error('denied');
    });
    store.getState().hydrate();
    store.getState().addTodo(input);
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().todos).toHaveLength(1);
    expect(store.getState().storageError).toBeTruthy();
  });
  it('retains changes when storage quota is exceeded', () => {
    const { store, storage } = setup();
    storage.setItem.mockImplementation(() => {
      throw new Error('quota');
    });
    store.getState().addTodo(input);
    expect(store.getState().todos).toHaveLength(1);
    expect(store.getState().storageError).toBeTruthy();
  });
  it('rejects invalid inputs', () => {
    const { store } = setup();
    expect(() => store.getState().addTodo({ ...input, title: ' ' })).toThrow();
    expect(store.getState().todos).toEqual([]);
  });
});
describe('selectors and validation', () => {
  function fixtures() {
    const { store } = setup();
    store.getState().addTodo({ ...input, title: 'Бета' });
    store.getState().addTodo({ ...input, title: 'Альфа' });
    store.getState().toggleTodo(store.getState().todos[1].id);
    return store.getState().todos.map((todo, index) => ({
      ...todo,
      createdAt: `2026-01-0${index + 1}T00:00:00.000Z`,
    }));
  }
  it('combines status and case-insensitive title search', () => {
    const todos = fixtures();
    expect(selectTodos(todos, 'all', '', 'newest')).toHaveLength(2);
    expect(selectTodos(todos, 'active', ' БЕТ ', 'newest')).toHaveLength(1);
    expect(selectTodos(todos, 'completed', 'Бета', 'newest')).toHaveLength(0);
    expect(selectTodos(todos, 'completed', '', 'newest')[0].title).toBe(
      'Альфа',
    );
  });
  it('sorts newest, oldest and alphabetically without changing source', () => {
    const todos = fixtures();
    expect(selectTodos(todos, 'all', '', 'newest')[0].title).toBe('Альфа');
    expect(selectTodos(todos, 'all', '', 'oldest')[0].title).toBe('Бета');
    expect(selectTodos(todos, 'all', '', 'alphabetical')[0].title).toBe(
      'Альфа',
    );
    expect(todos[0].title).toBe('Бета');
  });
  it.each([
    { title: 'x'.repeat(121) },
    { description: 'x'.repeat(2001) },
    { priority: 'urgent' },
    { dueDate: '2026-02-30' },
    { dueDate: '31.12.2026' },
  ])('rejects invalid field %o', (field) => {
    expect(todoInputSchema.safeParse({ ...input, ...field }).success).toBe(
      false,
    );
  });
});

describe('planning and data safety', () => {
  it('restores deleted tasks without discarding subsequent changes', () => {
    const { store } = setup();
    store.getState().addTodo(input);
    const deleted = store.getState().todos[0];
    store.getState().deleteTodo(deleted.id);
    store.getState().addTodo({ ...input, title: 'После удаления' });
    store.getState().undo();
    expect(store.getState().todos.map((todo) => todo.title)).toEqual([
      'После удаления',
      'Задача',
    ]);
  });
  it('merges backups without duplicates and rejects invalid files atomically', () => {
    const { store, storage } = setup();
    store.getState().addTodo(input);
    const backup = storage.setItem.mock.calls[0][1];
    expect(store.getState().importTodos(backup)).toBe(0);
    const other = setup();
    expect(other.store.getState().importTodos(backup)).toBe(1);
    expect(() => other.store.getState().importTodos('{broken')).toThrow();
    expect(other.store.getState().todos).toHaveLength(1);
  });
  it('syncs a valid external update and protects corrupt external data', () => {
    const { store, storage } = setup();
    const other = setup();
    other.store.getState().addTodo(input);
    storage.getItem.mockReturnValue(other.storage.setItem.mock.calls[0][1]);
    store.getState().sync();
    expect(store.getState().todos).toHaveLength(1);
    storage.getItem.mockReturnValue('{bad');
    store.getState().sync();
    storage.setItem.mockClear();
    store.getState().addTodo(input);
    expect(store.getState().todos).toHaveLength(2);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('preserves subtask progress and toggles favorites', () => {
    const { store } = setup();
    store.getState().addTodo({
      ...input,
      project: 'Работа',
      subtasks: [{ id: 'step', title: 'Первый шаг', completed: false }],
    });
    const id = store.getState().todos[0].id;
    store.getState().toggleSubtask(id, 'step');
    store.getState().toggleStar(id);
    expect(store.getState().todos[0].subtasks?.[0].completed).toBe(true);
    expect(
      selectTodos(store.getState().todos, 'starred', '', 'newest', 'Работа'),
    ).toHaveLength(1);
  });
  it('selects local calendar dates and sorts undated tasks last', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 9, 12));
    const { store } = setup();
    store.getState().addTodo({ ...input, dueDate: '2026-10-09' });
    store.getState().addTodo({ ...input, dueDate: '2026-10-08' });
    store.getState().addTodo({ ...input, dueDate: '2026-10-10' });
    store.getState().addTodo({ ...input, dueDate: '' });
    const todos = store.getState().todos;
    expect(selectTodos(todos, 'today', '', 'newest')).toHaveLength(1);
    expect(selectTodos(todos, 'overdue', '', 'newest')).toHaveLength(1);
    expect(selectTodos(todos, 'upcoming', '', 'newest')).toHaveLength(1);
    expect(selectTodos(todos, 'all', '', 'dueDate').at(-1)?.dueDate).toBe('');
  });
});
