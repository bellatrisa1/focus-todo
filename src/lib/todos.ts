import type { Filter, Sort, Todo } from '@/features/todos/types/todo';
export function selectTodos(
  todos: Todo[],
  filter: Filter,
  query: string,
  sort: Sort,
  project = '',
) {
  return todos
    .filter((todo) => {
      const today = localDate();
      const matches =
        filter === 'all' ||
        (filter === 'active' && !todo.completed) ||
        (filter === 'completed' && todo.completed) ||
        (filter === 'starred' && todo.starred) ||
        (filter === 'today' && !todo.completed && todo.dueDate === today) ||
        (filter === 'upcoming' &&
          !todo.completed &&
          !!todo.dueDate &&
          todo.dueDate > today) ||
        (filter === 'overdue' &&
          !todo.completed &&
          !!todo.dueDate &&
          todo.dueDate < today);
      return (
        matches &&
        (!project || (todo.project || 'Без проекта') === project) &&
        `${todo.title} ${todo.description ?? ''} ${todo.project ?? ''}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
      );
    })
    .sort((a, b) =>
      sort === 'priority'
        ? { high: 0, medium: 1, low: 2 }[a.priority] -
          { high: 0, medium: 1, low: 2 }[b.priority]
        : sort === 'dueDate'
          ? (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
          : sort === 'alphabetical'
            ? a.title.localeCompare(b.title, 'ru')
            : sort === 'oldest'
              ? a.createdAt.localeCompare(b.createdAt)
              : b.createdAt.localeCompare(a.createdAt),
    );
}
export function formatDueDate(value: string) {
  return new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}
export function localDate() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return today;
}

export function isOverdue(value: string) {
  return value < localDate();
}
