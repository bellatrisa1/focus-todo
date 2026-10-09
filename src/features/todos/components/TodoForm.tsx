'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/Modal';
import { todoInputSchema } from '../schemas/todo';
import type { Todo, TodoInput } from '../types/todo';
import { useTodoStore } from '../store/todo-store';
import s from './TodoForm.module.scss';
export function TodoForm({
  todo,
  onClose,
  onCreated,
}: {
  todo?: Todo;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [steps, setSteps] = useState(todo?.subtasks ?? []);
  const [stepTitle, setStepTitle] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TodoInput>({
    resolver: zodResolver(todoInputSchema),
    defaultValues: todo ?? {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      project: '',
      starred: false,
    },
  });
  const save = (input: TodoInput) => {
    input = { ...input, subtasks: steps };
    const store = useTodoStore.getState();
    if (todo) store.updateTodo(todo.id, input);
    else {
      store.addTodo(input);
      store.setFilter('all');
      store.setSearchQuery('');
      store.setSort('newest');
      onCreated?.();
    }
    onClose();
  };
  return (
    <Modal
      title={todo ? 'Редактировать задачу' : 'Новая задача'}
      onClose={onClose}
    >
      <form className={s.form} onSubmit={handleSubmit(save)} noValidate>
        <label htmlFor="title">
          Название <span>*</span>
        </label>
        <input
          id="title"
          data-initial-focus
          placeholder="Что нужно сделать?"
          {...register('title')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p className={s.error} id="title-error" role="alert">
            {errors.title.message}
          </p>
        )}
        <label htmlFor="description">
          Описание <small>необязательно</small>
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Детали, которые помогут начать"
          {...register('description')}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
        />
        {errors.description && (
          <p id="description-error" className={s.error} role="alert">
            {errors.description.message}
          </p>
        )}
        <div className={s.row}>
          <div>
            <label htmlFor="priority">Приоритет</label>
            <select id="priority" {...register('priority')}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
            {errors.priority && (
              <p role="alert" className={s.error}>
                {errors.priority.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="dueDate">Срок выполнения</label>
            <input
              type="date"
              id="dueDate"
              {...register('dueDate')}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'date-error' : undefined}
            />
            {errors.dueDate && (
              <p id="date-error" role="alert" className={s.error}>
                Введите корректную дату
              </p>
            )}
          </div>
        </div>
        <label htmlFor="project">
          Проект <small>необязательно</small>
        </label>
        <input
          id="project"
          placeholder="Например, Работа или Личное"
          maxLength={40}
          {...register('project')}
          list="project-options"
        />
        <datalist id="project-options">
          {Array.from(
            new Set(
              useTodoStore
                .getState()
                .todos.map((task) => task.project)
                .filter(Boolean),
            ),
          ).map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        {errors.project && (
          <p role="alert" className={s.error}>
            {errors.project.message}
          </p>
        )}
        <label htmlFor="step-title">
          Шаги задачи <small>{steps.length}/30</small>
        </label>
        <div className={s.stepInput}>
          <input
            id="step-title"
            value={stepTitle}
            maxLength={120}
            placeholder="Разбейте задачу на небольшие шаги"
            onChange={(event) => setStepTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (stepTitle.trim() && steps.length < 30) {
                  setSteps([
                    ...steps,
                    {
                      id: crypto.randomUUID(),
                      title: stepTitle.trim(),
                      completed: false,
                    },
                  ]);
                  setStepTitle('');
                }
              }
            }}
          />
          <button
            type="button"
            className="secondary"
            disabled={!stepTitle.trim() || steps.length >= 30}
            onClick={() => {
              setSteps([
                ...steps,
                {
                  id: crypto.randomUUID(),
                  title: stepTitle.trim(),
                  completed: false,
                },
              ]);
              setStepTitle('');
            }}
          >
            Добавить шаг
          </button>
        </div>
        {steps.map((step) => (
          <div className={s.stepInput} key={step.id}>
            <span>{step.title}</span>
            <button
              type="button"
              className="icon-button"
              aria-label={`Удалить шаг: ${step.title}`}
              onClick={() =>
                setSteps(steps.filter((item) => item.id !== step.id))
              }
            >
              ×
            </button>
          </div>
        ))}
        <div className={s.actions}>
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="primary" disabled={isSubmitting} type="submit">
            {todo ? 'Сохранить изменения' : 'Создать задачу'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
