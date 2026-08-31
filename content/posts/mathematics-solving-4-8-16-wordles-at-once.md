---
title: "The Mathematics of Solving 4, 8, and 16 Wordles at Once"
seoTitle: "The Math of Quordle, Octordle & Sedecordle"
date: 2026-08-31
lastmod: 2026-08-31
draft: false
description: "Why Quordle, Octordle, and Sedecordle get harder: search-space growth, entropy curves, shared-guess efficiency, solve probabilities, and the endgame bottleneck."
tags: ["wordle", "quordle", "octordle", "sedecordle", "mathematics", "entropy", "probability", "word games"]
slug: "mathematics-solving-4-8-16-wordles-at-once"
---

Solving four Wordles at once sounds like four times the work. Solving sixteen sounds like sixteen times the work.

The mathematics says something stranger.

The number of possible answer combinations grows exponentially, yet every guess also returns feedback from every unsolved board. More boards create more uncertainty, but they also make each shared guess more informative. Then, late in the game, that advantage suddenly disappears: information is no longer the scarce resource. Guesses are.

That tension explains the shape of Quordle, Octordle, and Sedecordle. Their difficulty does not come from one enormous word puzzle. It comes from coordinating many ordinary puzzles through one shared sequence of guesses.

This article builds a mathematical model of that coordination: the search space, the entropy curve, the efficiency of shared guesses, the probability of finishing on time, and the reason sixteen boards feel dramatically harder even when the turn allowance rises with the board count.

## The rules create a coupled search problem

Let:

- \(N\) be the number of possible answer words;
- \(k\) be the number of boards; and
- \(G\) be the total number of permitted guesses.

In the common classic formats, \(k=4\) for Quordle, \(k=8\) for Octordle, and \(k=16\) for Sedecordle. The familiar guess budgets are 9, 13, and 21 respectively. Every submitted word is applied to every board, but each board returns its own green, yellow, and gray pattern.

The boards are independent in their hidden answers and coupled in the action used to discover them. That distinction drives nearly all of the interesting mathematics.

## Search spaces: from billions to numbers with 54 digits

A single board selected from an answer dictionary of size \(N\) has \(N\) possible states. If the boards are labeled and answers may repeat, \(k\) boards have

```text
Nᵏ
```

possible answer tuples.

Using \(N=2,309\) as an illustrative Wordle-sized answer set gives:

| Game size | Raw answer tuples | Initial uncertainty |
|---|---:|---:|
| 1 board | 2,309 | 11.17 bits |
| 4 boards | about 2.84 × 10¹³ | 44.70 bits |
| 8 boards | about 8.08 × 10²⁶ | 89.40 bits |
| 16 boards | about 6.53 × 10⁵³ | 178.79 bits |

The uncertainty column comes from

```text
H₀ = log₂(Nᵏ) = k log₂(N).
```

Doubling the number of boards squares the number of possible tuples, but it only doubles the number of bits required to identify the tuple. This is the first reason “exponentially larger search space” does not mean “exponentially more guesses.” A well-chosen guess extracts information from all boards in parallel.

If a particular game guarantees that all answers are different, the exact ordered count is the falling factorial

```text
N × (N − 1) × ... × (N − k + 1).
```

For dictionaries much larger than 16, this is close to \(N^k\). The exponential conclusion remains the same.

## One guess can produce 243 patterns per board

Each of five tiles has three possible states: gray, yellow, or green. Ignoring impossible color combinations, that gives an upper bound of

```text
3⁵ = 243
```

feedback patterns on one board. Across \(k\) boards, a shared guess can theoretically produce as many as \(243^k\) joint patterns.

The corresponding ceiling is

```text
log₂(243ᵏ) = k log₂(243) ≈ 7.925k bits.
```

That is about 31.7 bits for four boards, 63.4 bits for eight, and 126.8 bits for sixteen—from one guess.

Those are mathematical ceilings, not realistic averages. English words are unevenly distributed, duplicate-letter rules make many color patterns impossible, and a guess rarely divides every candidate list into 243 equally likely groups. Still, the scaling matters: the information returned by a shared guess also grows roughly in proportion to the number of active boards.

So the puzzle contains two competing forms of growth:

```text
uncertainty added by k boards      ∝ k
feedback available from one guess ∝ k
```

Early in the game, parallel feedback largely offsets parallel uncertainty. Late in the game, it does not.

## Entropy measures the value of a guess

Suppose Board \(i\) has candidate set \(S_i\). For a proposed guess \(g\), place every candidate answer into the feedback bucket it would produce. If \(p_{i,r}\) is the fraction of candidates producing pattern \(r\), the guess's entropy on that board is

```text
Hᵢ(g) = −Σᵣ pᵢ,ᵣ log₂(pᵢ,ᵣ).
```

A guess with one huge bucket and several tiny ones has low entropy. A guess that divides the candidates into many balanced buckets has high entropy.

For multiple boards, the simplest shared score is additive:

```text
Hshared(g) = Σᵢ Hᵢ(g), over unsolved boards.
```

This sum has a clean interpretation. If the answer boards are conditionally independent, it is the expected reduction in the logarithm of the joint candidate space.

Imagine four boards with 64 candidates each. The joint space contains \(64^4=2^{24}\) answer tuples. If a guess supplies 3 expected bits per board, it removes about 12 bits in total, shrinking the typical joint space by a factor near \(2^{12}=4,096\).

That is why a word that cannot be the answer to any current board may still be the best move. Its job is not necessarily to score a direct hit. Its job is to split several candidate sets at once.

## What an entropy curve looks like

The remaining uncertainty after turn \(t\) can be written as

```text
Rₜ = Σᵢ log₂ |Sᵢ,t|.
```

An idealized game has three phases.

### Phase 1: steep information gain

The opening words test common letters and useful positions across every board. Because all boards are still active, a broad guess can earn information repeatedly. The total entropy curve drops sharply.

### Phase 2: uneven board resolution

Some boards collapse to one or two candidates while others retain large word families. The curve still falls, but less smoothly. A globally strong guess must balance the broad boards against small, dangerous ambiguities such as `_IGHT` or `_OUND`.

### Phase 3: the staircase endgame

Once candidate lists are nearly resolved, knowing the answers is not enough. Each remaining answer usually has to be entered as a guess. The entropy graph approaches zero, but the game may still require several turns. It falls like a staircase as individual boards are cashed out.

This is the crucial mismatch: **zero informational uncertainty does not imply zero guesses remaining**.

If five boards are unsolved and their answers are all known, the player still normally needs five distinct guesses. The endgame is therefore governed by a scheduling lower bound:

```text
guesses remaining ≥ number of distinct known answers still unplayed.
```

No amount of entropy optimization can beat that bound.

## Shared-guess efficiency

We can describe a guess's shared efficiency in several useful ways.

The most direct is total information per submitted word:

```text
Etotal(g) = Σᵢ Hᵢ(g).
```

But a pure sum can hide neglect. A guess might earn nearly all its value on two broad boards while doing nothing for a small board that is about to become dangerous. Two companion measures help:

```text
Ecoverage(g) = number of boards for which Hᵢ(g) > 0
Emin(g)      = minimum useful Hᵢ(g) among urgent boards.
```

In practice, a robust shared score can combine these ideas:

```text
score(g) = Σᵢ wᵢHᵢ(g) + solve bonus − endgame penalty.
```

The weight \(w_i\) can rise for a board with a dangerous word family or too few turns of slack. The solve bonus rewards guesses that are actual candidates. The endgame penalty discourages a beautiful information probe when every remaining turn is needed to submit known answers.

This explains why optimal play changes over time:

- Early guesses should maximize coverage and total entropy.
- Middle guesses should resolve distinctions shared by multiple boards.
- Late guesses should become candidate answers, often on the most constrained or most dangerous board.

The [Quordle Solver](https://monkeytactics.com/tools/quordle-solver.html), [Octordle Solver](https://monkeytactics.com/tools/octordle-solver.html), and [Sedecordle Solver](https://monkeytactics.com/tools/sedecordle-solver.html) make this bookkeeping visible by tracking separate candidate sets while evaluating one shared move.

## The probability of solving Quordle within nine guesses

There is no strategy-free probability of winning in nine. The answer depends on the answer dictionary, accepted guess list, hard-mode rules, answer sampling, and—most importantly—the policy used to choose guesses.

But there is a useful baseline formula.

Let \(F(9)\) be the probability that one board is solved by guess 9 under a fixed policy. If four board outcomes were independent, then

```text
P(all four solved by 9) = F(9)⁴.
```

That fourth power punishes even a small per-board failure rate:

| Per-board probability by guess 9 | Four-board probability |
|---:|---:|
| 95% | 81.45% |
| 98% | 92.24% |
| 99% | 96.06% |
| 99.5% | 98.01% |

This table is illustrative, not a measured Quordle win-rate table. Real boards under a shared policy are not independent: the same opening guess can be unusually good or bad across several boards, and later guesses are selected from the joint state.

The exact probability is better written as

```text
P(max(T₁,T₂,T₃,T₄) ≤ 9),
```

where \(T_i\) is the turn on which Board \(i\) is solved. Estimating it honestly requires simulation:

1. Fix the answer list, allowed guesses, duplicate-letter rules, and strategy.
2. Sample four answer words according to the game's rules.
3. Play the full shared-guess policy until all boards are solved or turn 9 ends.
4. Repeat for many puzzles.
5. Report wins divided by trials, along with a confidence interval.

For \(W\) wins in \(M\) independent simulations, the estimated win probability is \(\hat p=W/M\). A rough 95% margin of error is

```text
1.96 × √(p̂(1 − p̂)/M).
```

With 100,000 simulated games and a win rate near 90%, that margin is about 0.19 percentage points. A quoted probability without a defined dictionary and policy is much less informative than it appears.

## Why adding boards compounds failure risk

The same independence approximation reveals a broader pattern. If a fixed strategy gives every board a marginal success probability \(p\) by a chosen deadline, then

```text
P(all k boards succeed) ≈ pᵏ.
```

For \(p=0.99\):

| Boards | Approximate all-board success |
|---:|---:|
| 4 | 96.06% |
| 8 | 92.27% |
| 16 | 85.15% |

Again, these are not game win rates. They isolate one mathematical effect: the maximum of many completion times is less forgiving than the completion time of one board. A single stubborn board loses the entire game.

As \(k\) rises, the player is increasingly likely to encounter at least one awkward answer: a repeated-letter word, a rare-letter word, or a large family that produces nearly identical feedback. If one board has probability \(q\) of being “troublesome,” then the chance of seeing at least one troublesome board is

```text
1 − (1 − q)ᵏ.
```

Even with \(q=5\%\), that probability is about 18.5% for four boards, 33.7% for eight, and 56.0% for sixteen.

## Why Sedecordle is exponentially harder—and why that phrase needs care

Sedecordle's raw joint search space is exponentially larger in the number of boards: \(N^{16}\) versus \(N^4\). In that precise sense, “exponentially harder” is defensible.

The human difficulty, however, comes from four interacting bottlenecks.

### 1. Extreme-value risk

You do not need an average board to go well. You need the worst of sixteen boards to go well. The maximum completion time tends to rise as more boards are added.

### 2. Endgame congestion

The classic guess budgets follow a revealing pattern:

| Boards | Guess budget | Guesses beyond one per board |
|---:|---:|---:|
| 4 | 9 | 5 |
| 8 | 13 | 5 |
| 16 | 21 | 5 |

Each format gives only about five turns beyond the theoretical minimum of submitting one distinct answer per board. Those five turns must perform most of the broad discovery work.

This is the deepest reason the games scale so sharply. The number of exploratory turns stays roughly fixed while the number of boards whose answers must be scheduled doubles.

### 3. Diminishing shared value

An opener can help sixteen boards. After ten boards are solved, a new guess can help at most six. The same five-letter probe becomes less valuable as the active set shrinks, exactly when the remaining boards are likely to be the hardest ones.

### 4. Cognitive load

Each board carries its own green positions, excluded yellow positions, absent letters, duplicate-letter bounds, and candidate families. Tracking sixteen such states is not just a larger vocabulary task. It is a memory and attention problem with frequent context switching.

So Sedecordle is not simply “four Quordles.” Its state space grows exponentially, its chance of containing an outlier rises, and its endgame becomes a tightly packed scheduling problem.

## A lower bound that explains the whole genre

Suppose a player uses \(e\) pure exploratory guesses before attempting any answer, and suppose the \(k\) hidden answers are distinct. Even with perfect deduction after exploration, at least \(k\) more guesses are needed to enter those answers.

Therefore:

```text
G ≥ e + k.
```

Rearranging gives the maximum pure exploration budget:

```text
e ≤ G − k.
```

For the 9/13/21 guess formats, \(G-k=5\) every time.

This does not mean the first five guesses should always be probes. Answer attempts also generate feedback on other boards, and lucky early guesses can solve multiple problems at once. But it explains the strategic pressure: every non-answer guess must justify consuming one of only a handful of turns not already reserved by the unsolved boards.

The best moves blur the distinction. They are plausible answers for one board and high-information probes for several others.

## A practical mathematical strategy

The equations suggest a simple decision process.

1. **Measure uncertainty per board.** Candidate count is a start; \(\log_2|S_i|\) makes boards comparable on an information scale.
2. **Seek cross-board splits early.** Prefer letters and positions that partition several active candidate sets.
3. **Watch the slack.** If \(r\) guesses remain and \(u\) boards are unsolved, then \(r-u\) is the maximum remaining allowance for guesses that solve nothing.
4. **Protect against the worst board.** A small but ambiguous family may deserve more attention than a large, well-partitioned list.
5. **Turn probes into answers.** As slack approaches zero, every guess should ideally solve one board while informing the rest.

That fourth step is where a pure entropy sum can fail. Expected information optimizes the average reduction; winning requires controlling the tail risk that one board survives the deadline.

## The surprising conclusion

Multi-board Wordle variants are simultaneously easier and harder than their enormous search spaces suggest.

They are easier because one guess is broadcast across every board. Early information arrives in parallel, so doubling the boards does not require twice as many exploratory guesses.

They are harder because answers must usually be submitted serially. As boards accumulate, the game shifts from parallel information gathering to a narrow endgame queue. One bad board, one wasted probe, or one unresolved word family can consume the tiny amount of slack.

That is the mathematics behind the feeling of escalation:

```text
Search is parallel.
Finishing is serial.
Failure is determined by the last board.
```

If you want help managing that tradeoff, use the [Quordle Solver](https://monkeytactics.com/tools/quordle-solver.html) for four boards, the [Octordle Solver](https://monkeytactics.com/tools/octordle-solver.html) for eight, or the [Sedecordle Solver](https://monkeytactics.com/tools/sedecordle-solver.html) for sixteen.

*Wordle is a trademark of The New York Times Company. Quordle is a trademark of Merriam-Webster, Incorporated. MonkeyTactics is an independent utility and is not affiliated with or endorsed by the games or their owners.*
