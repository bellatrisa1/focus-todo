import { test, expect } from '@playwright/test';
test('create, validate, edit, persist, filter, toggle and delete', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Мои задачи.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Новая задача', exact: true }).click();
  await page
    .getByRole('button', { name: 'Создать задачу', exact: true })
    .last()
    .click();
  await expect(page.getByText('Введите название задачи')).toBeVisible();
  await page.getByLabel('Название').fill('Подготовить презентацию');
  await page.getByLabel('Описание').fill('Собрать результаты проекта');
  await page.getByLabel('Приоритет').selectOption('high');
  await page.getByLabel('Срок выполнения').fill('2026-12-31');
  await page
    .getByRole('button', { name: 'Создать задачу', exact: true })
    .last()
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Подготовить презентацию', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Редактировать: Подготовить презентацию' })
    .click();
  await page.getByLabel('Название').fill('Отправить презентацию');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /^Активные/ }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: /^Выполненные/ }).click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: /^Все задачи/ }).click();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/workspace-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel('Поиск задач').fill('нет совпадений');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
  await page.getByLabel('Поиск задач').fill('ОТПРАВИТЬ');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Удалить: Отправить презентацию' })
    .click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Удалить: Отправить презентацию' })
    .click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('modal keyboard interaction and clear completed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Новая задача', exact: true }).click();
  await expect(page.getByLabel('Название')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Новая задача', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Новая задача', exact: true }).click();
  await page.getByLabel('Название').fill('Готово');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать задачу' })
    .click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Очистить выполненные' }).click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Место для ваших планов')).toBeVisible();
});

test('projects, steps, favorites, backup import and undo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Новая задача', exact: true }).click();
  await page.getByLabel('Название').fill('Запустить проект');
  await page
    .getByRole('dialog')
    .getByLabel('Проект', { exact: false })
    .fill('Студия');
  await page.getByLabel('Шаги задачи').fill('Составить план');
  await page.getByRole('button', { name: 'Добавить шаг', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать задачу' })
    .click();
  await page.getByLabel('Составить план', { exact: true }).check();
  await page
    .getByRole('button', { name: 'В избранное: Запустить проект' })
    .click();
  await page.getByRole('button', { name: /^Избранное/ }).click();
  await expect(
    page.getByRole('button', { name: 'Запустить проект', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Студия', exact: true }).click();
  await page.reload();
  await expect(
    page.getByLabel('Составить план', { exact: true }),
  ).toBeChecked();
  await page
    .getByRole('button', { name: 'Резервная копия', exact: true })
    .click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Скачать копию/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^focus-backup-/);
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        todos: [
          {
            id: 'imported',
            title: 'Из копии',
            priority: 'low',
            completed: false,
            createdAt: '2026-10-09T12:00:00.000Z',
            updatedAt: '2026-10-09T12:00:00.000Z',
          },
        ],
      }),
    ),
  });
  await page
    .getByRole('button', { name: 'Добавить задачи', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Добавлено задач: 1' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить: Из копии' }).click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await page.getByRole('button', { name: 'Отменить удаление' }).click();
  await expect(
    page.getByRole('button', { name: 'Из копии', exact: true }),
  ).toBeVisible();
});

test('changes appear in another browser tab', async ({ page, context }) => {
  await page.goto('/');
  const second = await context.newPage();
  await second.goto('/');
  await expect(
    second.getByRole('button', { name: 'Новая задача', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Новая задача', exact: true }).click();
  await page.getByLabel('Название').fill('Общая задача');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Создать задачу' })
    .click();
  await expect(
    second.getByRole('button', { name: 'Общая задача', exact: true }),
  ).toBeVisible();
  await second.getByRole('checkbox').check();
  await expect(page.getByRole('checkbox')).toBeChecked();
});
