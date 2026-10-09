import type { Metadata } from 'next';
import '@/styles/globals.scss';
export const metadata: Metadata = {
  title: 'Focus — Мои задачи',
  description:
    'Спокойное пространство для ваших задач. Планируйте, расставляйте приоритеты и двигайтесь в своём темпе.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
