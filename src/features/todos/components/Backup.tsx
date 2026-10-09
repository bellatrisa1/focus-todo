'use client';
import { useRef, useState } from 'react';
import { Modal } from '@/components/Modal';
import { useTodoStore } from '../store/todo-store';
export function Backup({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [raw, setRaw] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const todos = useTodoStore((state) => state.todos);
  return (
    <Modal title="Резервная копия" onClose={onClose}>
      <p className="dialog-copy">
        Сохраните задачи в JSON-файл. Импорт добавляет новые задачи и сохраняет
        текущие; совпадающие ID пропускаются. Файл содержит названия и описания
        — храните его в надёжном месте.
      </p>
      <div className="backup-actions">
        <button
          className="primary"
          data-initial-focus
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify({ version: 1, todos }, null, 2)], {
                type: 'application/json',
              }),
            );
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `focus-backup-${new Date().toISOString().slice(0, 10)}.json`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setMessage(
              'Файл подготовлен для скачивания. Проверьте папку загрузок.',
            );
          }}
        >
          Скачать копию · {todos.length}
        </button>
        <button className="secondary" onClick={() => input.current?.click()}>
          Выбрать JSON-файл
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          setRaw(null);
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setMessage('Файл слишком большой. Максимум 5 МБ.');
            return;
          }
          try {
            const text = await file.text();
            const { storedTodosSchema } = await import('../schemas/todo');
            const data = storedTodosSchema.parse(JSON.parse(text));
            setRaw(text);
            setMessage(
              `В файле ${data.todos.length} задач. Подтвердите добавление.`,
            );
          } catch {
            setMessage(
              'Не удалось прочитать копию Focus. Проверьте формат файла.',
            );
          }
        }}
      />
      <p role="status" className="dialog-copy">
        {message}
      </p>
      {raw && (
        <button
          className="primary"
          onClick={() => {
            try {
              const count = useTodoStore.getState().importTodos(raw);
              setRaw(null);
              setMessage(
                `Добавлено задач: ${count}.${useTodoStore.getState().storageError ? ' Сохранение недоступно: изменения пока только в памяти.' : ''}`,
              );
            } catch {
              setMessage(
                'Импорт недоступен: хранилище не восстановлено. Текущие задачи сохранены в памяти.',
              );
            }
          }}
        >
          Добавить задачи
        </button>
      )}
    </Modal>
  );
}
