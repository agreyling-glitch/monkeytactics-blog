---
title: "The Five-Guess Paradox: Why Multi-Board Word Games Give You Five Exploratory Turns"
seoTitle: "The Five-Guess Paradox in Quordle & Sedecordle"
date: 2026-08-31
lastmod: 2026-08-31
draft: false
description: "Quordle, Octordle, and Sedecordle all leave five guesses beyond one answer per board. Here is how that hidden limit controls probes, strategy, and the endgame."
tags: ["quordle", "octordle", "sedecordle", "wordle", "strategy", "mathematics", "word games"]
slug: "five-guess-paradox-multi-board-word-games"
---

Quordle gives you 9 guesses to solve 4 boards. Octordle gives you 13 guesses to solve 8. Sedecordle gives you 21 guesses to solve 16.

Those rules look progressively more generous. The largest game gives you twelve more guesses than the smallest.

But subtract the number of answers you must enter:

| Game | Boards (\(k\)) | Guess limit (\(G\)) | \(G-k\) |
|---|---:|---:|---:|
| Quordle | 4 | 9 | **5** |
| Octordle | 8 | 13 | **5** |
| Sedecordle | 16 | 21 | **5** |

All three classic formats leave the same margin: **five guesses beyond one guess per hidden answer**.

That is the five-guess paradox. The board count doubles, then doubles again, yet the allowance for guesses that solve no board does not grow at all.

The observation is more than trivia. It explains why broad opening words are powerful, why the middle game must convert information into answers, and why one unnecessary probe can make a perfectly understood puzzle mathematically impossible to finish.

## What counts as an exploratory guess?

We need a precise definition before doing the arithmetic.

An **exploratory guess**—or pure probe—is a submitted word that does not solve any currently unsolved board. It may reveal excellent information. It may reduce hundreds of candidates to a handful. But on that turn, it does not remove an answer from the endgame queue.

An **answer guess** solves at least one board. It may also be highly informative elsewhere.

This distinction is based on the result, not the player's intention. If you enter `SLATE` for letter coverage and one hidden answer happens to be `SLATE`, that turn is not a pure probe. It has already paid for one of the required answers.

That caveat matters because the best multi-board guesses often perform both jobs: they finish one board while testing useful letters on several others.

## The lower bound behind the paradox

Suppose a game has:

- \(k\) unsolved boards with distinct answers;
- \(G\) total guesses; and
- \(e\) pure exploratory guesses that solve none of them.

After the probes, every distinct answer still has to be submitted. That requires at least \(k\) additional turns. Therefore:

```text
G ≥ e + k
```

or equivalently:

```text
e ≤ G − k.
```

For the classic 4-, 8-, and 16-board formats:

```text
e ≤ 5.
```

This is a hard scheduling bound. It does not care how clever the probes are. Five opening words could reveal every answer with certainty, but the answers still have to pass through the single shared input one at a time.

The game gathers information in parallel and enters solutions serially.

That mismatch is the entire paradox.

## Why six pure probes guarantee failure

Consider a Sedecordle with 16 distinct hidden answers and 21 total turns.

If the first six guesses solve no board, the position after turn 6 is:

```text
16 boards still unsolved
15 guesses remaining
```

Even if an oracle now tells you all sixteen answers, you cannot enter them in fifteen slots. At least one board must remain unsolved.

The same proof works for the other games:

| Game | After six non-solving probes | Minimum answer guesses needed | Result |
|---|---:|---:|---|
| Quordle | 3 guesses remain | 4 | Impossible |
| Octordle | 7 guesses remain | 8 | Impossible |
| Sedecordle | 15 guesses remain | 16 | Impossible |

The sixth probe does not merely make the game risky. Under the distinct-answer assumption, it makes the game unwinnable.

This remains true even if the sixth word produces perfect green-and-yellow information on every board. Information cannot create another row in the grid.

## Five probes are possible, not automatically wise

The inequality \(e≤5\) defines a ceiling, not a recommendation.

Using five pure probes leaves exactly \(k\) turns for \(k\) answers. From that point onward, every guess must solve a board. There is no room for:

- choosing the wrong member of a two-word family;
- testing a repeated letter;
- entering a valid word that turns out not to be an answer;
- overlooking a constraint on one board; or
- discovering that the last board still has multiple candidates.

Five probes spend all the slack. Four probes preserve one recovery turn. Three preserve two.

That produces a more useful strategic quantity than the raw guess count.

## Endgame slack: the number to watch

Let:

- \(r\) be guesses remaining; and
- \(u\) be unsolved boards with distinct answers.

Define **slack** as

```text
slack = r − u.
```

Slack is the maximum number of future guesses that may fail to solve a board while the game remains theoretically winnable.

| Slack | Meaning |
|---:|---|
| 3 or more | Room for targeted probes and some recovery |
| 2 | Probe only if it resolves an important risk |
| 1 | One miss or non-solving guess remains affordable |
| 0 | Every remaining guess must solve a board |
| Below 0 | The game is already impossible under the assumptions |

The value updates after every turn.

If a guess solves one board, then both \(r\) and \(u\) fall by one, so slack stays the same. If a guess solves nothing, \(r\) falls while \(u\) does not, so slack drops by one. If a single submitted word happens to solve two boards with the same answer, slack increases—but classic multi-board games commonly use different answers, so that rescue should not be assumed.

This makes slack a compact measure of strategic health. Candidate counts tell you how much you know. Slack tells you how many mistakes you can still survive.

## Why strong openings are so valuable

A pure probe costs exactly one unit of slack whether it is brilliant or terrible. The difference is how much uncertainty it removes before that scarce unit disappears.

A strong opening word:

- tests five productive letters;
- avoids unnecessary repeats;
- creates many balanced feedback patterns;
- separates candidate families across several boards; and
- leaves clues that later answer guesses can exploit.

A weak opening may repeat low-value letters, retest information already known, or divide only a few boards meaningfully. Both guesses consume one row. Only one makes the remaining queue manageable.

That is why shared entropy matters. For a guess \(g\), add its expected information across all unsolved boards:

```text
Hshared(g) = H₁(g) + H₂(g) + ... + Hᵤ(g).
```

Early in the game, \(u\) is large, so one word can earn information on 4, 8, or 16 boards simultaneously. A broad probe is at its most efficient when every board is still listening.

But high entropy alone is not the objective. The goal is to turn a limited amount of slack into a queue of answers that can be entered without misses.

## How bad early guesses destroy the queue

Imagine an Octordle player begins with four words:

```text
MUMMY
QUEUE
KAYAK
VIVID
```

These are valid illustrative guesses, but together they spend four turns on heavy letter repetition. They test far fewer distinct letters than four well-coordinated coverage words could.

If none is an answer, the state is now:

```text
9 guesses remain
8 boards remain
slack = 1
```

The player may still have dozens of candidates across several boards, but can afford only one more guess that solves nothing. A fifth broad probe would reduce slack to zero. Every remaining word would then have to be a correct answer.

The damage is not simply “we learned fewer letters.” The bad openings have created a congested endgame queue:

```text
uncertain boards → must be resolved
known answers     → must be submitted
available rows    → almost fully reserved
```

Once the queue is full, even a board with two candidates is dangerous. Trying the wrong candidate consumes the only recovery slot.

## A Quordle example: information-rich but already lost

Suppose the first six Quordle guesses are all excellent coverage words and none happens to be an answer.

After turn 6:

```text
Guesses remaining: 3
Boards unsolved:   4
Slack:            −1
```

The color grid might uniquely determine all four answers. The player could write them on paper. The game is still lost because only three submissions remain.

This is the cleanest demonstration of the difference between two resources:

1. **Information budget:** enough feedback to identify the answers.
2. **Submission budget:** enough rows to enter the answers.

Wordle mostly trains players to protect the first. Multi-board games force them to protect both.

## The best guess solves and probes at the same time

The five-probe ceiling suggests a better middle-game rule: stop treating “exploration” and “solving” as separate phases.

Suppose one Quordle board has candidates `CRANE` and `CRATE`, while two other boards need information about `N` and `T`. Guessing one of those candidates does three things:

- it has a chance to solve the first board;
- it distinguishes the first board if it misses; and
- it tests useful letters on the others.

This is a **dual-purpose guess**. It spends a turn but may preserve slack by removing a board from the queue.

The ideal transition looks like this:

```text
broad probes → plausible answer/probes → forced answers
```

The weakest transition is:

```text
broad probes → more broad probes → panic guesses
```

As soon as a board has a credible answer that also contributes elsewhere, the opportunity cost of another pure probe rises sharply.

## A practical probe budget for each game

There is no universal optimal number of opening probes. The answer depends on feedback, answer vocabulary, and risk tolerance. But the five-turn bound gives a disciplined framework.

### Quordle

With four boards and nine guesses, two or three broad openers often leave meaningful flexibility. Four non-solving openers leave only one unit of slack; a fifth creates a perfect-play endgame in which every remaining guess must hit.

Use the [Quordle Solver](https://monkeytactics.com/tools/quordle-solver.html) to compare candidate counts across all four boards before spending another turn on coverage.

### Octordle

Eight boards produce more feedback per opener, so the same early probes can expose many likely answers. The trap is assuming thirteen guesses means plenty of time. Four failed probes leave nine rows for eight boards: only one miss remains affordable.

The [Octordle Solver](https://monkeytactics.com/tools/octordle-solver.html) helps identify answer attempts that also split candidates on the other seven boards.

### Sedecordle

Sixteen boards make the opening feedback spectacularly efficient—and the endgame queue unforgiving. After four pure probes, seventeen turns remain for sixteen boards. Waiting for every board to become certain before entering answers is usually the wrong model. Solving must begin while other boards are still being narrowed.

The [Sedecordle Solver](https://monkeytactics.com/tools/sedecordle-solver.html) is especially useful for tracking which boards are forced, which remain broad, and which candidate answer offers the most shared value.

## Three rules derived from the paradox

### 1. Count slack, not just turns

“I have ten guesses left” means little without the number of unsolved boards. Ten guesses for eight boards gives two units of slack. Ten guesses for ten boards gives none.

### 2. Charge every probe its real price

A probe does not cost one turn in the abstract. It consumes one of at most five turns not already needed for the answer queue. Ask whether its information gain is worth that fraction of the entire exploration budget.

### 3. Prefer guesses that leave the queue shorter

Once useful candidate answers appear, favor words that can solve one board and inform others. Preserving slack is often more valuable than maximizing a small increase in total entropy.

## Important caveats

The five-guess result depends on the classic 9/13/21 limits and on answers requiring separate submissions.

It changes when:

- a game mode uses a different guess limit;
- hidden answers may repeat, allowing one word to solve multiple boards;
- a “probe” accidentally equals an answer;
- answers are prefilled or supplied by a rescue mode; or
- the game automatically accepts deduced answers without another guess.

So “exactly five exploratory turns” means **five is the maximum number of pure non-solving guesses compatible with a win in these classic formats**. It does not mean every winning game should deliberately use all five.

That more precise statement is also the more useful one.

## The five-guess paradox in one equation

The larger games appear to give you more room:

```text
Quordle:    9 guesses
Octordle:  13 guesses
Sedecordle: 21 guesses
```

But the unavoidable answer queue grows at exactly the same rate:

```text
exploration ceiling = total guesses − boards = 5.
```

The board count changes. The safety margin does not.

That is why early guesses matter so much, why six pure probes guarantee failure, and why the strongest move is rarely “just a probe” or “just an answer.” Great multi-board play uses one word for both jobs.

For the broader information theory behind this result, read [The Mathematics of Solving 4, 8, and 16 Wordles at Once](/posts/mathematics-solving-4-8-16-wordles-at-once/).

*Wordle is a trademark of The New York Times Company. Quordle is a trademark of Merriam-Webster, Incorporated. MonkeyTactics is an independent utility and is not affiliated with or endorsed by the games or their owners.*
