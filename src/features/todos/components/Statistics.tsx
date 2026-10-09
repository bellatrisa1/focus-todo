import { Icon } from '@/components/Icon';
import s from './Workspace.module.scss';
export function Statistics({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <section className={s.statistics} aria-label="Статистика задач">
      <div className={s.stat}>
        <span className={s.statIcon}>
          <Icon name="grid" />
        </span>
        <div>
          <span>Всего задач</span>
          <strong>{total}</strong>
        </div>
      </div>
      <div className={s.stat}>
        <span className={`${s.statIcon} ${s.orange}`}>
          <Icon name="circle" />
        </span>
        <div>
          <span>В процессе</span>
          <strong>{total - completed}</strong>
        </div>
      </div>
      <div className={s.stat}>
        <span className={`${s.statIcon} ${s.green}`}>
          <Icon name="check" />
        </span>
        <div>
          <span>Выполнено</span>
          <strong>
            {completed}
            <small>{percent}% от всех задач</small>
          </strong>
        </div>
      </div>
    </section>
  );
}
