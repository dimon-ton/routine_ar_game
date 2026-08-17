import { expect, test, type Page } from '@playwright/test';

const answers: Record<string, string> = {
  'wake up': 'wake up',
  'brush my teeth': 'brush my teeth',
  'take a shower': 'take a shower',
  'have breakfast': 'have breakfast',
  'go to school': 'go to school',
  'do homework': 'do homework',
  'have dinner': 'have dinner',
  'go to bed': 'go to bed',
};
const sentences: Record<string, string> = {
  'What time do you wake up?': "I wake up at six o'clock.",
  'What time do you brush your teeth?': 'I brush my teeth at six fifteen.',
  'What time do you take a shower?': 'I take a shower at six thirty.',
  'What time do you have breakfast?': "I have breakfast at seven o'clock.",
  'What time do you go to school?': "I go to school at eight o'clock.",
  'What time do you do homework?': "I do homework at four o'clock.",
  'What time do you have dinner?': "I have dinner at six o'clock.",
  'What time do you go to bed?': "I go to bed at nine o'clock.",
};

async function startMouse(page: Page) {
  await page.goto('/?test=1');
  await page.getByRole('button', { name: /Mouse \/ Touch/ }).click();
  await page.getByRole('button', { name: /Start Game/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
}
async function currentHeading(page: Page) {
  return (await page.locator('.question-area h1').innerText()).trim();
}
async function answerCorrect(page: Page, round: number) {
  const heading = await currentHeading(page);
  const answer =
    round === 2
      ? (await page.locator('.clock-prompt img').getAttribute('alt'))?.replace('Clock showing ', '')
      : round === 3
        ? sentences[heading]
        : answers[heading];
  if (!answer) throw new Error(`No correct answer found for Round ${round}: ${heading}`);
  await page
    .getByRole('button', { name: new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    .click();
}
async function finishRound(page: Page, round: number) {
  for (let i = 0; i < 8; i += 1) {
    await answerCorrect(page, round);
    if (i < 7) await expect(page.getByText(`Question ${i + 2}/8`)).toBeVisible();
  }
}

test('starts without requesting a camera and completes a correct Round 1 answer', async ({
  page,
}) => {
  await startMouse(page);
  await expect(page.getByText('Round 1')).toBeVisible();
  await expect(page.locator('.question-area [lang="th"]')).toHaveCount(0);
  await answerCorrect(page, 1);
  await expect(page.getByText(/Correct! \+1 point/)).toBeVisible();
  await expect(page.getByText('Question 2/8')).toBeVisible();
});

test('loads every vocabulary picture choice successfully', async ({ page }) => {
  await startMouse(page);
  for (let index = 0; index < 8; index += 1) {
    await expect
      .poll(() =>
        page.locator('.choice-card img').evaluateAll(
          (images) =>
            images.length === 3 &&
            images.every((image) => {
              const picture = image as HTMLImageElement;
              return picture.complete && picture.naturalWidth > 0;
            }),
        ),
      )
      .toBe(true);
    await answerCorrect(page, 1);
    if (index < 7) await expect(page.getByText(`Question ${index + 2}/8`)).toBeVisible();
  }
});

test('requires a pinch gesture and explains it to the student', async ({ page }) => {
  await page.goto('/?test=1');
  await page.getByRole('button', { name: /Mouse \/ Touch/ }).click();
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect(page.getByText(/pinch your thumb and index finger/i)).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByText(/pinch your thumb and index finger to choose/i)).toBeVisible();
  await page.getByRole('button', { name: 'Open teacher settings' }).click();
  await expect(page.getByRole('button', { name: 'Dwell' })).toHaveCount(0);
});

test('starts audible looping ambience when the first question begins', async ({ page }) => {
  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    const testedWindow = window as typeof window & {
      ambiencePlayCalls: Array<{ src: string; loop: boolean; volume: number }>;
    };
    testedWindow.ambiencePlayCalls = [];
    HTMLMediaElement.prototype.play = function () {
      testedWindow.ambiencePlayCalls.push({
        src: this.currentSrc || this.src,
        loop: this.loop,
        volume: this.volume,
      });
      return originalPlay.call(this);
    };
  });

  await page.goto('/?test=1');
  await page.getByRole('button', { name: /Mouse \/ Touch/ }).click();
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              ambiencePlayCalls: Array<{ src: string; loop: boolean; volume: number }>;
            }
          ).ambiencePlayCalls,
      ),
    )
    .toContainEqual(
      expect.objectContaining({
        src: expect.stringContaining('children-focus-background.mp3'),
        loop: true,
        volume: 0,
      }),
    );

  await page.getByRole('button', { name: /Continue/ }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              ambiencePlayCalls: Array<{ src: string; loop: boolean; volume: number }>;
            }
          ).ambiencePlayCalls,
      ),
    )
    .toContainEqual(
      expect.objectContaining({
        src: expect.stringContaining('children-focus-background.mp3'),
        loop: true,
        volume: 0.04,
      }),
    );
});

test('focuses correct and wrong answer feedback over the background', async ({ page }) => {
  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    const testedWindow = window as typeof window & {
      feedbackPlayCalls: Array<{ src: string; volume: number }>;
    };
    testedWindow.feedbackPlayCalls = [];
    HTMLMediaElement.prototype.play = function () {
      testedWindow.feedbackPlayCalls.push({
        src: this.currentSrc || this.src,
        volume: this.volume,
      });
      return originalPlay.call(this);
    };
  });

  await startMouse(page);
  const heading = await currentHeading(page);
  const correct = answers[heading];
  const cards = page.locator('.choice-card');
  for (let index = 0; index < (await cards.count()); index += 1) {
    const card = cards.nth(index);
    if (!(await card.getAttribute('aria-label'))?.includes(correct)) {
      await card.click();
      break;
    }
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              feedbackPlayCalls: Array<{ src: string; volume: number }>;
            }
          ).feedbackPlayCalls,
      ),
    )
    .toContainEqual(
      expect.objectContaining({
        src: expect.stringContaining('wrong-gentle-low-tone.mp3'),
        volume: 0.62,
      }),
    );

  await expect(page.getByText(/Try again!/)).not.toBeVisible();
  await page
    .getByRole('button', { name: new RegExp(correct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              feedbackPlayCalls: Array<{ src: string; volume: number }>;
            }
          ).feedbackPlayCalls,
      ),
    )
    .toContainEqual(
      expect.objectContaining({
        src: expect.stringContaining('correct-magic-marimba.mp3'),
        volume: 0.72,
      }),
    );
});

test('shows gentle retry feedback after an incorrect answer', async ({ page }) => {
  await startMouse(page);
  const heading = await currentHeading(page);
  const correct = answers[heading];
  const cards = page.locator('.choice-card');
  for (let index = 0; index < (await cards.count()); index += 1) {
    const card = cards.nth(index);
    if (!(await card.getAttribute('aria-label'))?.includes(correct)) {
      await card.click();
      break;
    }
  }
  await expect(page.getByText(/Try again!/)).toBeVisible();
  await expect(page.getByText('Question 1/8')).toBeVisible();
});

test('lets the teacher set and persist the background volume', async ({ page }) => {
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
    if (!descriptor?.get || !descriptor.set) return;
    const testedWindow = window as typeof window & { volumeChanges: number[] };
    testedWindow.volumeChanges = [];
    Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
      configurable: true,
      get: descriptor.get,
      set(value: number) {
        testedWindow.volumeChanges.push(value);
        descriptor.set?.call(this, value);
      },
    });
  });
  await startMouse(page);
  await page.getByRole('button', { name: 'Open teacher settings' }).click();
  const volume = page.getByRole('slider', { name: /Background volume/ });
  await expect(volume).toHaveValue('0.04');
  await volume.fill('0.14');
  await expect(page.getByText('14%', { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { volumeChanges: number[] }).volumeChanges.at(-1),
      ),
    )
    .toBe(0.14);
  const backgroundSound = page.getByRole('checkbox', { name: 'Background sound' });
  const masterSound = page.getByRole('checkbox', { name: 'Sound & ambience' });
  await expect(backgroundSound).toBeChecked();
  await backgroundSound.uncheck();
  await expect(masterSound).toBeChecked();
  await expect(volume).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { volumeChanges: number[] }).volumeChanges.at(-1),
      ),
    )
    .toBe(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('daily-routine-preferences') ?? '{}').backgroundSound,
      ),
    )
    .toBe(false);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('daily-routine-preferences') ?? '{}').backgroundVolume,
      ),
    )
    .toBe(0.14);
});

test('advances through rounds, displays results, and restarts', async ({ page }) => {
  await startMouse(page);
  await finishRound(page, 1);
  await expect(page.getByRole('heading', { name: 'Catch the Time' })).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();
  await finishRound(page, 2);
  await expect(page.getByRole('heading', { name: 'Choose the Correct Sentence' })).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();
  await finishRound(page, 3);
  await expect(page.getByRole('heading', { name: 'Great Job!' })).toBeVisible();
  await expect(page.getByText('24', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Again' }).click();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
});

test('fits desktop and tablet classroom layouts without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.goto('/?test=1');
  await expect(page.getByRole('heading', { name: /Daily Routine/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/desktop-welcome.png', fullPage: true });
  await page.getByRole('button', { name: /Mouse \/ Touch/ }).click();
  await page.getByRole('button', { name: /Start Game/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.screenshot({ path: 'test-results/desktop-game.png', fullPage: true });
  await page.setViewportSize({ width: 820, height: 1180 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.choice-card')).toHaveCount(3);
  await page.screenshot({ path: 'test-results/tablet-game.png', fullPage: true });
});
