'use client';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { STORAGE_KEY } from '../store/todo-store';
import { Backup } from './Backup';
import { selectTodos } from '@/lib/todos';
import { useTodoStore } from '../store/todo-store';
import type { Todo, Sort } from '../types/todo';
import { Sidebar, filterLabels } from './Sidebar';
import { Statistics } from './Statistics';
import { TodoItem } from './TodoItem';
import { TodoForm } from './TodoForm';
import s from './Workspace.module.scss';
export function TodoWorkspace() {
  const {
    todos,
    filter,
    searchQuery,
    sort,
    hydrated,
    storageError,
    hydrate,
    setFilter,
    setSearchQuery,
    setSort,
    deleteTodo,
    clearCompleted,
  } = useTodoStore();
  const [backup, setBackup] = useState(false);
  const [project, setProject] = useState('');
  const undoTodos = useTodoStore((state) => state.undoTodos);
  const undo = useTodoStore((state) => state.undo);
  const projects = Array.from(
    new Set(todos.map((todo) => todo.project || 'Без проекта')),
  ).sort((a, b) => a.localeCompare(b, 'ru'));
  const [editor, setEditor] = useState<Todo | 'new' | null>(null);
  const [deletion, setDeletion] = useState<Todo | 'completed' | null>(null);
  useEffect(() => {
    hydrate();
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null)
        useTodoStore.getState().sync();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [hydrate]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('input, textarea, select, dialog') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.key.toLowerCase() === 'n' && hydrated) {
        event.preventDefault();
        setEditor('new');
      }
      if (event.key === '/') {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>('[aria-label="Поиск задач"]')
          ?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [hydrated]);
  const visible = useMemo(
    () => selectTodos(todos, filter, searchQuery, sort, project),
    [todos, filter, searchQuery, sort, project],
  );
  const completed = todos.filter((todo) => todo.completed).length;
  return (
    <div className={s.shell}>
      <Sidebar
        filter={filter}
        counts={{
          all: todos.length,
          active: todos.length - completed,
          completed,
          today: selectTodos(todos, 'today', '', 'newest').length,
          upcoming: selectTodos(todos, 'upcoming', '', 'newest').length,
          overdue: selectTodos(todos, 'overdue', '', 'newest').length,
          starred: todos.filter((todo) => todo.starred).length,
        }}
        onFilter={(next) => {
          setFilter(next);
          setProject('');
        }}
      />
      <div className={s.mainColumn}>
        <header className={s.topbar}>
          <span>
            Моё пространство <span className={s.slash}>/</span>{' '}
            <strong>Задачи</strong>
          </span>
          <button
            className="secondary"
            disabled={!hydrated}
            onClick={() => setBackup(true)}
          >
            Резервная копия
          </button>
          <span className={s.localBadge}>
            <span />
            Локальное хранение
          </span>
        </header>
        <main className={s.main}>
          <div className={s.heading}>
            <div>
              <div className={s.eyebrow}>ПЛАНИРУЙТЕ ОСОЗНАННО</div>
              <h1>
                Мои задачи<span>.</span>
              </h1>
              <p>От первого шага до большого результата. В вашем темпе.</p>
            </div>
            <button
              className="primary"
              disabled={!hydrated}
              onClick={() => setEditor('new')}
            >
              <Icon name="plus" size={18} />
              Новая задача
            </button>
          </div>
          {storageError && (
            <p className={s.warning} role="alert">
              {storageError}
            </p>
          )}
          {!hydrated ? (
            <div className={s.loading} role="status">
              Загружаем ваши задачи…
            </div>
          ) : (
            <>
              <div className={s.dayCard}>
                <div>
                  <span>ВАШ ФОКУС НА СЕГОДНЯ</span>
                  <strong>
                    {selectTodos(todos, 'today', '', 'newest').length
                      ? `${selectTodos(todos, 'today', '', 'newest').length} задач со сроком сегодня`
                      : 'Хороший день, чтобы сделать первый шаг'}
                  </strong>
                  <p>
                    {selectTodos(todos, 'overdue', '', 'newest').length
                      ? `Просрочено: ${selectTodos(todos, 'overdue', '', 'newest').length}. Пересмотрите сроки и выберите главное.`
                      : 'Разбейте большую задачу на шаги — начинать станет проще.'}
                  </p>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    setFilter('today');
                    setProject('');
                    setSearchQuery('');
                  }}
                >
                  Открыть сегодня →
                </button>
              </div>
              <Statistics total={todos.length} completed={completed} />
              <section className={s.taskSection} aria-label="Задачи">
                <div className={s.sectionHeading}>
                  <h2>
                    {filterLabels[filter]}
                    <span>{visible.length}</span>
                  </h2>
                  <button
                    className={s.clear}
                    disabled={!completed}
                    onClick={() => setDeletion('completed')}
                  >
                    <Icon name="trash" size={15} />
                    Очистить выполненные
                  </button>
                </div>
                <div className={s.projects} aria-label="Проекты">
                  <button
                    className={!project ? s.projectSelected : ''}
                    aria-pressed={!project}
                    onClick={() => setProject('')}
                  >
                    Все проекты
                  </button>
                  {projects.map((name) => (
                    <button
                      key={name}
                      aria-pressed={project === name}
                      className={project === name ? s.projectSelected : ''}
                      onClick={() => setProject(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className={s.toolbar}>
                  <div className={s.search}>
                    <Icon name="search" size={18} />
                    <input
                      aria-label="Поиск задач"
                      placeholder="Найти задачу…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="icon-button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Очистить поиск"
                      >
                        <Icon name="close" size={15} />
                      </button>
                    )}
                  </div>
                  <select
                    aria-label="Сортировка задач"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="alphabetical">По алфавиту</option>
                    <option value="priority">По приоритету</option>
                    <option value="dueDate">По сроку</option>
                  </select>
                </div>
                <div aria-live="polite" className="sr-only">
                  Найдено задач: {visible.length}
                </div>
                {visible.length ? (
                  <ul className={s.list}>
                    {visible.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onEdit={() => setEditor(todo)}
                        onDelete={() => setDeletion(todo)}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className={s.empty}>
                    <div className={s.emptyArt}>
                      <span />
                      <Icon name={searchQuery ? 'search' : 'check'} size={40} />
                      <i />
                    </div>
                    <h3>
                      {searchQuery
                        ? 'Ничего не найдено'
                        : filter === 'completed'
                          ? 'Победы ещё впереди'
                          : filter === 'active' && todos.length
                            ? 'Всё сделано. Отличная работа!'
                            : filter === 'all' && !project
                              ? 'Место для ваших планов'
                              : 'Здесь пока нет задач'}
                    </h3>
                    <p>
                      {searchQuery
                        ? 'Попробуйте другое название или очистите поиск.'
                        : filter === 'completed'
                          ? 'Отметьте задачу выполненной — она появится здесь.'
                          : filter === 'all' && !project
                            ? 'Запишите первую задачу и сделайте шаг к своей цели.'
                            : 'Измените раздел или добавьте подходящую задачу.'}
                    </p>
                    {searchQuery ? (
                      <button
                        className="secondary"
                        onClick={() => setSearchQuery('')}
                      >
                        Очистить поиск
                      </button>
                    ) : (
                      <button
                        className="primary"
                        onClick={() => setEditor('new')}
                      >
                        <Icon name="plus" size={17} />
                        Создать задачу
                      </button>
                    )}
                  </div>
                )}
              </section>
              <footer className={s.footer}>
                <Icon name="check" size={14} />
                <span>
                  {storageError
                    ? 'Изменения хранятся в памяти'
                    : 'Изменения сохраняются автоматически в этом браузере'}
                </span>
                <span className={s.footerRight}>Ваш темп. Ваш прогресс.</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {undoTodos && (
        <div className={s.toast} role="status">
          <span>Задачи удалены</span>
          <button onClick={undo}>Отменить удаление</button>
          <button
            aria-label="Скрыть уведомление"
            onClick={() => useTodoStore.setState({ undoTodos: null })}
          >
            ×
          </button>
        </div>
      )}
      {backup && <Backup onClose={() => setBackup(false)} />}
      {editor && (
        <TodoForm
          todo={editor === 'new' ? undefined : editor}
          onCreated={() => setProject('')}
          onClose={() => setEditor(null)}
        />
      )}
      {deletion && (
        <Modal
          title={
            deletion === 'completed'
              ? 'Очистить выполненные задачи?'
              : 'Удалить задачу?'
          }
          onClose={() => setDeletion(null)}
        >
          <p className={s.confirmText}>
            {deletion === 'completed'
              ? `Будут удалены все выполненные задачи (${completed}).`
              : `«${deletion.title}» будет удалена.`}{' '}
            Это действие нельзя отменить.
          </p>
          <div className={s.confirmActions}>
            <button
              className="secondary"
              data-initial-focus
              onClick={() => setDeletion(null)}
            >
              Отмена
            </button>
            <button
              className="danger"
              onClick={() => {
                if (deletion === 'completed') clearCompleted();
                else deleteTodo(deletion.id);
                setDeletion(null);
              }}
            >
              Удалить
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
