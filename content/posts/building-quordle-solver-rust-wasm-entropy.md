---
title: "How We Built a Four-Board Quordle Solver with Rust, WebAssembly, and Entropy"
seoTitle: "Building a Quordle Solver with Rust, WASM & Entropy"
date: 2026-08-29
lastmod: 2026-08-29
draft: false
description: "Inside the MonkeyTactics Quordle Solver: four-board constraint tracking, duplicate-letter scoring, entropy-ranked shared guesses, Rust/WASM filtering, and a mobile-friendly interface."
tags: ["quordle", "word games", "rust", "webassembly", "entropy", "solver engineering"]
slug: "building-quordle-solver-rust-wasm-entropy"
---

Quordle looks like four Wordle boards placed beside one another. That description is visually accurate—and computationally incomplete.

Every guess is shared across four independent answers. Each board returns its own green, yellow, and gray pattern. A useful next move must therefore do more than fit one set of clues: it should reduce uncertainty across every board that remains unsolved.

That is the problem we built the free [MonkeyTactics Quordle Solver](https://monkeytactics.com/tools/quordle-solver.html) to solve. It combines a Rust/WebAssembly dictionary engine with browser-side entropy analysis, giving players four candidate lists and one information-rich shared recommendation without sending their guesses to a server.

## The real problem: one guess, four results

A single Wordle board has one evolving constraint set. Quordle has four:

- A letter can be green on Board 1, yellow on Board 2, gray on Board 3, and unknown on Board 4.
- A shared guess consumes one turn on all four boards.
- Repeated letters must be counted correctly on each board.
- Solved boards should stop influencing later recommendations.
- A strong candidate for one board may reveal almost nothing about the other three.

The obvious implementation—run a Wordle word filter four times—only solves the first half of the problem. It can tell us which answers still fit each board, but not which next guess uses the shared turn most effectively.

That requires a second layer: estimate how much information every possible guess could reveal on each unsolved board, then combine those values into one ranking.

## Why a normal word list is not enough

Many word-game helpers ask for a few known letters and return words that match. That can be useful, but it leaves the player to reconcile four lists and choose a shared move manually.

Our solver keeps the entire game state together. It:

- records the five tile colors for all four boards;
- handles duplicate letters with Wordle-style counting rules;
- filters each board to compatible candidates;
- calculates a separate entropy value for every unsolved board;
- ranks one shared next guess by combined information gain;
- removes completed boards from the ranking; and
- preserves the relationship between a guess and all four feedback patterns.

In the example below, `CRANE` leaves 34 candidates on Board 1, 29 on Board 2, 2 on Board 3, and 87 on Board 4. The solver recommends `COIRS`, with an estimated 10.65 bits of information across the four unsolved boards.

![Four-board Quordle analysis showing the recommended shared guess, candidate counts, and per-board entropy bars.](/images/posts/quordle-four-board-analysis.png)

*The four-board view makes the tradeoff visible: one shared recommendation, four independent candidate sets.*

The exact word and bit value change with the clues and selected dictionary. The important part is the ranking method: the recommendation is chosen for its expected ability to split the remaining possibilities across all active boards.

## The breakthrough: rank guesses by expected information

Entropy gives us a practical way to measure the expected information in a guess.

For a proposed word, the solver compares it with every remaining candidate answer and calculates the feedback pattern that answer would produce. Those answers are grouped into buckets such as gray-gray-yellow-green-gray. A guess that divides the candidates into many balanced buckets is more useful than one that leaves most candidates in a single large group.

The score uses Shannon entropy:

```text
H = -Σ p(pattern) × log₂ p(pattern)
```

Here, `p(pattern)` is the proportion of candidate answers that would produce a particular five-tile pattern.

The solver calculates that value independently for each unsolved board, then adds the board scores:

```text
shared score = H(board 1) + H(board 2) + H(board 3) + H(board 4)
```

If a board is complete, it contributes nothing. That matters late in a game: once two boards are solved, the next recommendation should concentrate entirely on the remaining two.

The per-board bars expose the calculation instead of hiding it behind a single number. A guess may be excellent for one board and mediocre for another. The combined score explains why it is still the best shared move, while the “Why this guess?” tooltip turns the metric into plain language.

## Rust and WebAssembly—plus a deliberately small JavaScript layer

It would be inaccurate to say that every part of the solver runs in Rust. The architecture uses each technology where it is most useful.

The shared Rust engine is compiled to WebAssembly and handles dictionary indexing and Wordle-compatible candidate filtering. The browser loads compressed Standard (ENABLE) dictionary chunks, indexes them locally, and asks the WASM engine for words compatible with each board's accumulated constraints.

The entropy and cross-board ranking layer is JavaScript. It generates the five-tile feedback patterns, builds the probability buckets, calculates the board entropy values, and combines them into the shared score. A bounded probe pool keeps this analysis responsive instead of scoring every dictionary entry without limit.

That split gives us several benefits:

- **Shared constraint logic.** The same Rust/WASM word engine can support Wordle, Quordle, and other word utilities.
- **Predictable filtering.** Explicit types and tested constraint rules reduce subtle errors around positions and letter counts.
- **Fast local search.** Indexed dictionaries can be filtered without a network round trip.
- **Flexible interaction.** JavaScript can update entropy bars, focus state, history, and keyboard colors immediately.
- **Privacy.** Guesses and tile feedback stay in the browser; the solver does not fetch an official daily answer.

JavaScript is capable of entropy analysis. WASM was not chosen because JavaScript “cannot” do the work. The hybrid design is useful because it reuses a performant, tested Rust word engine while keeping the rapidly changing interface and ranking orchestration close to the DOM.

## Duplicate letters are a constraint problem

Repeated letters are one of the easiest ways to build a plausible but incorrect solver.

Suppose a guess contains two `E`s, but the answer contains only one. One `E` may be green or yellow while the other is gray. Treating every gray tile as “this letter is absent” would incorrectly eliminate the real answer.

The feedback algorithm therefore runs in two passes:

1. Mark exact-position matches as green and remove those letters from the unmatched answer counts.
2. Evaluate the remaining guessed letters against the remaining counts, marking yellow only while a matching copy is still available.

The accumulated board constraints also need minimum and maximum counts. A yellow or green tile proves that at least one copy exists; an additional gray copy can establish the maximum. That logic is applied independently on all four boards.

## UX challenge: make four boards usable

The mathematics only helps if players can enter feedback quickly and understand the result. Four boards, four candidate lists, a shared history, and a full keyboard can become a very tall page—especially on a phone.

We designed the interface around progressive focus.

### Select one board when you need detail

Selecting any result-board heading expands that board and temporarily hides the other three candidate lists. The expanded panel uses the available width to show more words with less scrolling. Select it again, or press `Escape`, to return to the four-board view.

![An expanded Quordle result board showing more candidates, the shared recommendation, and the selected board highlighted in guess history.](/images/posts/quordle-focus-board.png)

*Board focus keeps the shared recommendation visible while giving one candidate list room to breathe.*

The selected board is also outlined in every shared-guess history row. That small visual connection prevents an easy mistake: reading the correct tile pattern from the wrong board.

### Mirror the active board on the keyboard

When a board is selected, its known gray, yellow, and green letter states are mirrored onto the on-screen keyboard. With a shared guess such as `CRANE`, pressing or tapping `C`, `R`, `A`, `N`, or `E` cycles the matching tile color on the selected board, including repeated occurrences.

The interaction resembles Wordle and Quordle instead of feeling like a separate data-entry form. Physical keyboard input and the on-screen keys use the same state transitions.

### Keep the recommendation visually distinct

Candidate words are intentionally quiet. The Best shared next guess uses a warmer gold treatment so the primary action does not disappear into the green interface. Completed boards turn green, their candidates stop contributing to the ranking, and completing all four boards triggers a congratulations dialog with options to keep or clear the results.

### Make mobile a first-class layout

On narrow screens, controls wrap, boards stack, and tap targets retain usable spacing. The expand-one-board behavior is particularly valuable on mobile: it removes three long lists without discarding their state.

## How to use the Quordle Solver

The workflow follows the game:

1. Play a five-letter word in Quordle Classic.
2. Enter that shared guess in the solver.
3. Select Board 1 through Board 4 and set each letter to gray, yellow, or green.
4. Select **Add guess to all four boards**.
5. Review the gold **Best shared next guess**, its combined entropy, and the “Why this guess?” explanation.
6. Select a board heading when you want a larger candidate view or board-specific keyboard colors.
7. Mark solved boards complete so future recommendations focus on the remaining boards.

Standard uses the public-domain ENABLE list and is the current dictionary for North American English. An Expanded option based on Wiktionary is coming soon. Because these are independent word lists, compatible candidates are not necessarily members of Quordle's private answer list.

[Try the free Quordle Solver →](https://monkeytactics.com/tools/quordle-solver.html)

## What we learned

The hardest part was not rendering four copies of a Wordle board. It was preserving the distinction between four independent constraint systems while helping the player spend one shared move.

Three design decisions made the biggest difference:

- Treat duplicate-letter feedback as counts, not simple presence or absence.
- Show entropy per board as well as the combined recommendation.
- Let the player move fluidly between the four-board overview and one-board focus.

The result is more than a word list. It is a local decision engine that explains where a shared guess earns its value.

## What comes next

The same architecture can extend beyond four boards. Octordle- and Sedecordle-style games increase the number of independent candidate sets, but the core model remains familiar: filter each board, exclude solved boards, estimate the information from a shared guess, and provide focus controls that keep the interface manageable.

Scaling the board count will introduce new questions. A straight sum of entropy may not always be the most human-friendly objective. Very large games may benefit from weighting nearly solved boards, penalizing guesses that neglect a difficult board, or adapting the probe pool as candidate sets shrink.

Those are interesting engineering problems because they sit at the intersection of search, probability, performance, and interface design—the same combination that made the four-board solver worth building.

*Quordle is a trademark of Merriam-Webster, Incorporated. MonkeyTactics is an independent utility and is not affiliated with or endorsed by Merriam-Webster.*
