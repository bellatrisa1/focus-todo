'use client';
import { Icon } from '@/components/Icon';
import { formatDueDate, isOverdue } from '@/lib/todos';
import type { Todo } from '../types/todo';
import { useTodoStore } from '../store/todo-store';
import s from './TodoItem.module.scss';
const priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
export function TodoItem({
  todo,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const toggle = useTodoStore((state) => state.toggleTodo);
  const toggleStar = useTodoStore((state) => state.toggleStar);
  const toggleSubtask = useTodoStore((state) => state.toggleSubtask);
  return (
    <li className={`${s.item} ${todo.completed ? s.completed : ''}`}>
      <input
        type="checkbox"
        className={s.checkbox}
        checked={todo.completed}
        onChange={() => toggle(todo.id)}
        aria-label={`${todo.completed ? 'Вернуть в активные' : 'Выполнить'}: ${todo.title}`}
      />
      <div className={s.content}>
        <button className={s.title} onClick={onEdit}>
          {todo.title}
        </button>
        {todo.description && <p>{todo.description}</p>}
        {!!todo.subtasks?.length && (
          <div className={s.steps}>
            <small>
              {todo.subtasks.filter((step) => step.completed).length} из{' '}
              {todo.subtasks.length} шагов
            </small>
            <progress
              max={todo.subtasks.length}
              value={todo.subtasks.filter((step) => step.completed).length}
              aria-label={`Прогресс: ${todo.title}`}
            />
            {todo.subtasks.map((step) => (
              <label key={step.id}>
                <input
                  type="checkbox"
                  checked={step.completed}
                  onChange={() => toggleSubtask(todo.id, step.id)}
                />
                <span>{step.title}</span>
              </label>
            ))}
          </div>
        )}
        <div className={s.meta}>
          {todo.project && <span className={s.project}>{todo.project}</span>}
          <span className={`${s.priority} ${s[todo.priority]}`}>
            <i />
            {priorityLabels[todo.priority]}
          </span>
          {todo.dueDate && (
            <span
              className={
                !todo.completed && isOverdue(todo.dueDate) ? s.overdue : ''
              }
            >
              <Icon name="calendar" size={14} />
              {formatDueDate(todo.dueDate)}
              {!todo.completed && isOverdue(todo.dueDate)
                ? ' · Просрочено'
                : ''}
            </span>
          )}
        </div>
      </div>
      <div className={s.actions}>
        <button
          className={`icon-button ${todo.starred ? s.starred : ''}`}
          aria-label={`В избранное: ${todo.title}`}
          aria-pressed={!!todo.starred}
          onClick={() => toggleStar(todo.id)}
        >
          ★
        </button>
        <button
          className="icon-button"
          aria-label={`Редактировать: ${todo.title}`}
          onClick={onEdit}
        >
          <Icon name="edit" size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={`Удалить: ${todo.title}`}
          onClick={onDelete}
        >
          <Icon name="trash" size={17} />
        </button>
      </div>
    </li>
  );
}
