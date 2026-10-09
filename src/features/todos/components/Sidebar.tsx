import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import type { Filter } from '../types/todo';
import s from './Workspace.module.scss';
export const filterLabels: Record<Filter, string> = {
  all: 'Все задачи',
  active: 'Активные',
  completed: 'Выполненные',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
  overdue: 'Просроченные',
  starred: 'Избранное',
};
export function Sidebar({
  filter,
  counts,
  onFilter,
}: {
  filter: Filter;
  counts: Record<Filter, number>;
  onFilter: (filter: Filter) => void;
}) {
  return (
    <aside className={s.sidebar}>
      <Link href="/" className={s.brand}>
        <Logo />
        focus<span className={s.brandDot}>.</span>
      </Link>
      <div className={s.workspaceLabel}>ЛИЧНОЕ ПРОСТРАНСТВО</div>
      <nav aria-label="Фильтры задач" className={s.navigation}>
        {(
          [
            'all',
            'today',
            'upcoming',
            'overdue',
            'starred',
            'active',
            'completed',
          ] as const
        ).map((key) => (
          <button
            key={key}
            onClick={() => onFilter(key)}
            aria-pressed={filter === key}
            className={filter === key ? s.selected : ''}
          >
            <Icon
              name={
                key === 'all'
                  ? 'grid'
                  : key === 'today' || key === 'upcoming' || key === 'overdue'
                    ? 'calendar'
                    : key === 'active' || key === 'starred'
                      ? 'circle'
                      : 'check'
              }
              size={19}
            />
            <span>{filterLabels[key]}</span>
            <b>{counts[key]}</b>
          </button>
        ))}
      </nav>
      <div className={s.sidebarNote}>
        <span className={s.noteIcon}>
          <Icon name="sun" size={22} />
        </span>
        <strong>
          Большое начинается
          <br />с маленького
        </strong>
        <p>
          Одна задача за раз.
          <br />
          Вы уже на верном пути.
        </p>
      </div>
      <div className={s.profile}>
        <span>Я</span>
        <div>
          <strong>Моё пространство</strong>
          <small>Только на этом устройстве</small>
        </div>
        <span className={s.online} />
      </div>
    </aside>
  );
}
