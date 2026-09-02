---
title: "Why an Absurdle Solver Is Technically Difficult to Build"
seoTitle: "Why Building an Absurdle Solver Is So Difficult"
date: 2026-09-02
lastmod: 2026-09-02
draft: false
description: "Inside the adversarial search behind the MonkeyTactics Absurdle Solver: feedback partitions, worst-case ranking, duplicate letters, browser performance, and Rust/WASM filtering."
tags: ["absurdle", "wordle", "word games", "algorithms", "minimax", "rust", "webassembly", "solver engineering"]
slug: "why-absurdle-solver-technically-difficult"
---

Absurdle looks almost exactly like Wordle: five-letter guesses, gray/yellow/green tiles, and eventually one completed word. The adversarial part is invisible.

Behind the board, Absurdle begins with a pool of possible answers rather than committing to one secret word. After each guess, it returns feedback that preserves a difficult compatible family. Every reply remains consistent with the full history, so the finished game still looks as though one answer had been selected from the beginning.

That creates the central engineering problem: **Absurdle is an adversarial search problem, not just a word-filtering problem.**

A normal Wordle solver asks which words could still be the hidden answer. An Absurdle solver has to ask a nastier question: if I play this word, what is the most unhelpful reply the game can legally give me?

There may be thousands of possible answers, thousands of possible guesses, and up to 243 five-tile feedback patterns connecting each pair. The candidate pool survives by narrowing to a compatible group after every turn. Building the [MonkeyTactics Absurdle Solver](https://monkeytactics.com/tools/absurdle-solver) therefore meant making a browser evaluate the game from the opponent's side, preserve Wordle's duplicate-letter rules, and return a useful move quickly enough to feel interactive.

If you enjoy word games, adversarial algorithms, Rust/WebAssembly, or the compromises behind fast browser tools, this is the interesting part hiding beneath the colored tiles.

## Wordle filtering is only the beginning

Suppose a Wordle solver has a remaining candidate set \(S\). After receiving the colors for a guess, it removes every word that could not have produced those colors. The hidden answer is assumed to have existed before the guess; the solver is recovering it.

Absurdle reverses the order of thought.

For a proposed guess \(g\), the game can compare \(g\) with every answer in \(S\), group the answers by the feedback pattern they would produce, and retain a difficult compatible group. Instead of predicting one fixed answer, our solver must evaluate the shape of all the replies still available to the adversary.

### Why the finished board still looks normal

Nothing on the board announces that this selection is happening. You enter a word, receive familiar colored tiles, and eventually complete a valid answer. Looking backward, that final answer is consistent with every earlier row.

The difference is not the appearance of the transcript but how it was produced. Wordle chooses an answer first and derives every reply from it. Absurdle can preserve a set of answers after each turn and delay the final commitment until your guesses leave it fewer places to hide. A completed Absurdle board can therefore be indistinguishable from a completed Wordle board even though the decision process was adversarial.

Conceptually, the process looks like this:

```text
proposed guess
      ↓ simulate every possible answer
feedback patterns
      ↓ group equal patterns
partition sizes
      ↓ select the largest legal group
worst-case branch
```

If `TRACE` produces ten possible feedback patterns, it also produces ten different futures. A strong solver cannot judge the word by its average-looking letters alone. It must measure those futures and assume the opponent will choose the least favorable one.

## Every guess creates families of answers

The core operation is partitioning.

### Step 1: build the feedback families

For each possible answer, the solver calculates the five-tile response to a guess. Answers with the same response belong to the same feedback family. One simplified example might look like this:

| Feedback family | Answers in the family |
|---|---:|
| Gray, gray, gray, gray, gray | 418 |
| Gray, yellow, gray, gray, gray | 173 |
| Gray, gray, green, gray, yellow | 61 |
| Other patterns combined | 290 |

If the adversary can preserve the 418-word family, then the guess's worst-case result is 418 remaining answers. It does not matter that another reply would leave only three. The opponent is not obliged to be helpful.

In practice, this means a guess is only as good as its largest hiding place. Nine beautifully small families do not compensate for one enormous family the game can choose.

### Step 2: measure the worst branch

For a guess \(g\), let \(F_r(g)\) be the set of answers producing feedback pattern \(r\). The primary score used by our solver is:

```text
worst_case(g) = maxᵣ |Fᵣ(g)|
```

The preferred guess minimizes that value:

```text
best_guess = arg min_g worst_case(g)
```

This is a one-move minimax calculation. We choose the move whose worst available reply hurts us least.

### Step 3: break ties and choose the probe

The interface exposes that reasoning as **Worst case: N remain**. It also reports the number of distinct replies and the expected number of survivors. Those secondary values help separate guesses whose largest partitions are equally large.

Strictly speaking, this is an adversarial largest-partition model, not a promise to reproduce every implementation-specific tie-break used by every Absurdle variant. It captures the defining strategic problem: plan against a moving target that can preserve a large compatible answer pool.

## Why entropy alone is not enough

Our [Quordle Solver](https://monkeytactics.com/tools/quordle-solver.html) ranks shared guesses by expected information gain. That is a natural objective when answers are fixed and all outcomes are weighted by their likelihood.

For Absurdle, a high average information gain can hide one terrible branch.

Consider this simplified comparison:

| Guess | Typical result | Worst result |
|---|---:|---:|
| Guess A | 30 answers remain | 400 remain |
| Guess B | 55 answers remain | 120 remain |

An entropy-based strategy might prefer Guess A because it usually makes more progress. Against an adversary, “usually” is the problem. If the 400-answer reply is legal, the game can choose it. A worst-case strategy prefers Guess B because it caps the damage at 120. That is the behavioral change the solver needs: stop rewarding attractive averages and start defending against the ugliest legal outcome.

The objectives answer different questions:

- Entropy asks how much a guess is expected to teach us.
- Worst-case partitioning asks how much uncertainty the opponent can force us to keep.

Both are useful search ideas, but only the second directly models the adversarial character of Absurdle.

## Duplicate letters make feedback surprisingly delicate

Partition quality depends entirely on feedback accuracy. One incorrect tile can place an answer in the wrong family and distort the ranking of every guess.

Repeated letters are the classic failure case. If the guess contains two `E`s but the answer contains one, the game cannot mark both copies yellow. Exact matches must consume letters before misplaced matches are considered.

The solver therefore scores feedback in two passes:

1. Mark green tiles and remove those matched letters from the remaining answer counts.
2. Examine the unmatched guess letters from left to right, assigning yellow only while an unused copy remains.

Gray also means more than “this letter does not occur.” In a mixed duplicate-letter result, one gray `E` may mean that no *additional* copy exists. The accumulated constraints need both minimum and maximum letter counts, not just a set of included and excluded characters.

This detail is easy to underestimate. The adversarial algorithm may be sophisticated, but it is worthless if its underlying Wordle scorer mishandles `SHEEP`, `EERIE`, or `LEVEL`.

## The straightforward algorithm is too expensive

Assume there are \(G\) legal guesses and \(A\) remaining answers. Evaluating every guess requires scoring it against every answer:

```text
work per turn ≈ G × A × word length
```

With five-letter words, the word length is constant, but the \(G \times A\) product can still reach millions of comparisons. Each comparison also creates or updates a feedback bucket. Repeating the full calculation after every click would make a browser interface feel sluggish, especially on a phone.

Our solver reduces that search without pretending the cost disappears. This is where the design stops being a neat algorithm on paper and becomes a browser-engineering problem.

First, a shared Rust engine compiled to WebAssembly loads and indexes the ENABLE and SOWPODS dictionaries. It applies the feedback history and returns only answers consistent with every previous row.

Then the browser's JavaScript ranking layer builds a bounded probe pool. It favors words containing high-frequency distinct letters, gives possible answers a tie-breaking advantage, and expands the pool when the answer set becomes small. Each shortlisted guess is evaluated against all remaining answers using the full duplicate-aware feedback function.

The resulting ranking uses these priorities:

1. smallest worst-case partition;
2. smallest expected number of answers remaining;
3. preference for a word that could itself be the answer; and
4. alphabetical order for deterministic ties.

This is a practical browser-search design: broad enough to find strategically strong probes, bounded enough to remain responsive, and deterministic enough that the same state produces the same recommendation.

The compromise matters. Exhaustively exploring every multi-turn future would produce a much larger search tree. Restricting the first pass too aggressively would make the interface fast but miss useful probes. The shipped solver instead performs a focused one-move minimax search over a strategically selected pool, then evaluates every remaining answer for each shortlisted word.

## A useful guess may be an impossible answer

One of the least intuitive solver behaviors is recommending a word that cannot be the final answer.

That can be correct. A probe word may test several unresolved letters and divide a stubborn family more evenly than any surviving candidate. Against Absurdle, the important question is not simply “could this win now?” but “how large a hiding place does this leave the opponent?”

Suppose the remaining answers share four positions and differ mainly in one letter. Guessing a survivor tests only one branch. A carefully chosen outsider can test several of those branch letters at once, forcing the adversary into a smaller family.

The solver labels words that remain possible answers, but it does not restrict recommendations to them. That preserves the distinction between a finishing guess and an information-gathering move.

## State management is part of the algorithm

An Absurdle session is a chain of commitments. Every submitted feedback row must remain compatible with every later answer. Removing or editing a row changes the candidate set, which changes every partition, which changes the best next guess.

The browser therefore recomputes the analysis whenever the player:

- adds feedback;
- edits the latest guess;
- removes a guess;
- clears the history; or
- changes the dictionary.

The on-screen keyboard also has to summarize evidence across the entire history. Green outranks yellow, and yellow outranks gray, while the actual candidate filter still retains the more precise per-position and per-count constraints.

These interface details are not separate from correctness. A mathematically sound engine paired with ambiguous input is still an unreliable solver.

## Why the browser architecture matters

The solver does not hand the hard calculation to a server. The dictionaries are downloaded in compressed chunks, decoded in the browser, and passed into the Rust/WebAssembly search engine. Guesses and feedback stay on the device.

That decision makes the tool more private, but it also removes an easy escape hatch: we cannot assume a powerful server, a warm cache shared by thousands of users, or an unlimited computation window. The same adversarial analysis must behave well on a desktop, an older phone, and everything between them.

That architecture provides three practical benefits:

- **Speed:** dictionary filtering and repeated analyses avoid network round trips.
- **Privacy:** the play history remains in the browser.
- **Resilience:** after the assets load, the interaction does not depend on a remote solving API.

Those benefits come with hard constraints:

- startup work must be visible while dictionary chunks load and decompress;
- a failed asset must produce a recoverable error rather than a dead interface;
- ranking cannot monopolize the main thread long enough to make taps feel broken;
- memory use must remain reasonable as multiple dictionaries are indexed; and
- the probe pool must scale down the search cost without hollowing out the strategy.

“Runs in the browser” is not merely a deployment detail. It determines how much of the search space we can inspect, how results are scheduled, and what responsiveness means on lower-powered devices. That local constraint is what makes the Rust/WASM and JavaScript split more than a technology showcase.

## How to use the Absurdle Solver

The workflow mirrors a game in progress:

1. Choose ENABLE, SOWPODS, or both dictionaries.
2. Enter a completed five-letter guess.
3. Select each tile until it matches the gray, yellow, or green feedback from the game.
4. Select **Add feedback & analyze**.
5. Review the best next guess, its worst-case survivor count, and the alternative ranked probes.
6. Play a recommendation in Absurdle and repeat with the reply it gives you.

The dictionaries are broader than any private game answer list, so a compatible word is not guaranteed to be an official target. The wider pool is deliberate: it makes the tool useful across variants without claiming access to a hidden daily answer.

Want to see the adversary move? [Try the free Absurdle Solver](https://monkeytactics.com/tools/absurdle-solver), enter the feedback from a live game, and watch the worst-case partitions update. Compare possible answers with outsider probe words and see exactly why the safest move is not always the most obvious one.

## What made this solver worth building

Absurdle exposes a useful lesson in algorithm design: a small rules change can replace an ordinary filtering problem with a game against an opponent.

The revealing failure mode is a solver that looks intelligent but optimizes the wrong objective. It can choose a word with excellent average information, celebrate several tiny partitions, and still leave one 400-word escape route. Replace average-first ranking with worst-case partitioning, and its behavior changes immediately: the recommendation becomes less flashy, but the opponent has nowhere equally large to run.

Duplicate letters create a quieter version of the same failure. One incorrectly assigned yellow tile moves answers into the wrong families. The final recommendation can still look plausible even though its minimax score is built on corrupted partitions. Correctness had to begin with the five-letter scorer before any adversarial strategy could be trusted.

The hard parts all follow from that shift:

- generate correct feedback for every guess-answer pair;
- partition the entire surviving word pool by reply;
- optimize for the branch the opponent wants, not the outcome we hope for;
- search enough guesses to find strong splits without locking up the browser; and
- explain the recommendation in terms a player can verify.

The result is not just a list of words that match colored tiles. It is a compact adversarial search engine—one that assumes the target will keep moving until there is nowhere left to hide. That combination of a deceptive puzzle, a measurable opponent, and a strict browser performance budget is exactly what made it worth building.

*Absurdle was created by qntm. MonkeyTactics is an independent utility and is not affiliated with or endorsed by Absurdle or its creator.*
