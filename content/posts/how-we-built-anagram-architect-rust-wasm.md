---
title: "How We Built Anagram Architect: Meaningful Anagrams with Rust and WebAssembly"
seoTitle: "Anagram Generator Built With Rust & WASM"
date: 2026-09-12
lastmod: 2026-09-13
draft: false
description: "See how Anagram Architect uses Rust, WebAssembly, parallel search, phrase ranking, patterns, and local dictionaries to find meaningful exact anagrams."
tags: ["anagrams", "anagram generator", "word games", "rust", "webassembly", "algorithms", "solver engineering"]
related_tools:
  - tool: "anagram-architect"
    priority: 100
slug: "how-we-built-anagram-architect-rust-wasm"
---

An exact anagram uses every letter from the original text once and only once. That rule sounds simple. The difficult part is finding a result that sounds like something a person might actually say.

Consider a few of the phrases we used while developing Anagram Architect:

- **Osama Bin Laden** → **Old man in a base**
- **The meaning of life** → **The fine game of nil**
- **Acorn computers** → **Crap on customer**
- **President Saddam Hussein** → **Dispensed human disaster**
- **Schoolmaster** → **The classroom**
- **Clint Eastwood** → **Old west action**

Each result preserves the source letters exactly after spaces, punctuation, and capitalization are ignored. Yet an ordinary dictionary search can produce thousands of other exact combinations that are technically correct and linguistically awful.

That gap—between a valid anagram and a memorable phrase—is why we built the free [MonkeyTactics Anagram Architect](https://monkeytactics.com/tools/anagram-architect). It combines a dedicated Rust/WebAssembly search engine, parallel browser workers, local dictionaries, language-aware ranking, and practical controls for exploring the search space. The source phrase stays in your browser.

## Finding an anagram is easy; finding a good one is hard

*Takeaway: exact letter accounting defines correctness, but language quality determines whether a result is useful.*

If a source phrase has 13 letters, the solver needs combinations of dictionary words whose combined letter counts match all 13. No letter may be missing, added, or used too many times.

A short phrase can already have an enormous number of possible search paths. Each usable first word creates a different remainder. Every word that fits that remainder creates another branch, and many branches eventually reach the same collection of words in a different order.

The raw search problem therefore includes:

- filtering a large dictionary to words whose letters fit the source;
- subtracting letters without counting errors;
- exploring promising combinations without freezing the page;
- pruning repeated or impossible paths;
- arranging selected words into plausible orders; and
- retaining the strongest results without filling memory with noise.

The last two points are what separate a phrase anagram generator from a basic word finder. A result such as “Old man in a base” has recognizable structure. A random ordering of equally valid dictionary words does not.

## Exact letter accounting in Rust

*Takeaway: the Rust engine handles the combinatorial core—constraints, subtraction, pruning, and exact completion.*

Anagram Architect normalizes the source to letters and converts it into a compact frequency signature. Every candidate word receives the same treatment. A word can enter the search only if none of its letter counts exceed the letters currently available.

The core operation is equivalent to this:

```text
remaining letters = source letters − selected word letters
```

If any count would become negative, that branch is invalid. If every count reaches zero, the branch is an exact anagram.

The dedicated Rust engine compiles to WebAssembly and performs this search locally. Rust is a good fit for the hot path because it gives us compact data structures, predictable control over allocations, and fast recursive search. WebAssembly lets that engine run in modern browsers without installing an application or sending the phrase to a server.

The engine also applies several bounds before descending into a branch. It indexes candidate letter signatures, rejects final-word remainders that cannot match any available word, and caches dead remainder states so repeated failures can be skipped. These checks are deliberately conservative: they remove impossible work without using language quality to discard an exact solution.

## Parallel workers keep the browser responsive

*Takeaway: independent search shards run away from the main interface thread and report live progress.*

A deep anagram search is exactly the kind of computation that can make a page appear unresponsive if it runs directly beside the interface. Anagram Architect distributes the work across multiple Web Workers—four in the normal production search at the time of writing.

Each worker loads the WASM engine and searches a different shard of the candidate space. The interface remains available to update progress, show a current leader, graph throughput, and respond to cancellation.

The live analysis panel reports useful signals while the search is running:

- estimated search completion;
- branches evaluated per second;
- exact combinations discovered;
- strongest candidates retained;
- progress for each worker;
- duplicate paths pruned; and
- the current leading phrase.

These measurements are more honest than an indeterminate spinner. An exhaustive search may take longer, but the page can show that the engine is advancing instead of leaving the user to wonder whether it stalled.

## Why valid phrases can still sound wrong

*Takeaway: dictionaries determine what is possible; ranking determines what is readable.*

A dictionary knows that a token exists. It does not necessarily know whether five tokens belong together.

Our Standard dictionary is based on ENABLE and favors a more focused word-game vocabulary. The Expanded dictionary adds much broader Wiktionary-derived coverage, including regional, historical, specialist, and uncommon entries. That breadth helps uncover unusual anagrams, but it also creates more opportunities for obscure words to crowd out natural phrases.

WordNet contributes lexical information such as parts of speech and common senses. Wiktionary improves coverage. Neither source alone can answer the central ranking question: does this complete sequence resemble a meaningful English phrase?

That requires a language-ranking layer.

## Ranking phrases instead of bags of words

*Takeaway: the best result must have useful words in a plausible order, not merely a high-scoring collection of tokens.*

Anagram Architect combines several signals when it scores a completed phrase:

- individual word frequency;
- WordNet-informed parts of speech;
- penalties for obscure or suspicious vocabulary;
- preferences for compact phrases;
- common two-word pair data;
- common three-word sequence data;
- phrase-shape rules, including adjective–noun, noun compounds, verb–object, and noun–preposition–noun;
- article and subject–verb agreement checks;
- penalties for unsupported multi-word sequences; and
- specialist boosts for known high-quality constructions.

Word frequency helps familiar vocabulary outrank dictionary noise. Parts of speech make it possible to prefer shapes resembling ordinary English, such as determiner–adjective–noun or verb–object structures. Pair and three-word sequence data reward local word order: “in a base” should receive more support than the same words in an implausible arrangement.

No single signal is enough. Frequency alone can overvalue common filler words. Shortness alone can prefer blunt fragments. Sequence data alone may miss clever or novel constructions—the very things that make anagrams enjoyable. The useful ranking comes from combining these signals and testing the results against difficult examples.

The displayed `#` number is the final phrase position within the current ranked result set. A specialist boost can help a particularly strong construction, but the visible number still reflects where the complete phrase appears after all ranking signals are combined.

Exactness and ranking have different guarantees. Every displayed result must use exactly the source letters. Ranking is an estimate of readability and naturalness; the first result is not a promise that the engine has identified the funniest or most meaningful possible interpretation.

## Measuring improvements without hiding regressions

*Takeaway: a ranking change is not an improvement if it promotes one famous phrase while quietly burying another.*

We maintain a benchmark suite of memorable anagrams covering single words, short phrases, longer constructions, guided searches, and the same multi-worker merge used by the interface. Examples include **Listen → Silent**, **The eyes → They see**, **Dormitory → Dirty room**, **Schoolmaster → The classroom**, **Slot machines → Cash lost in 'em**, and **Clint Eastwood → Old west action**.

The benchmark records each expected phrase's rank, specialist rank, node count, and elapsed time. A normal run now compares those measurements with a committed baseline. It fails when a target disappears or regresses beyond its rank tolerance, warns when search work or runtime grows materially, and writes a machine-readable JSON report with median rank, worst rank, and total search cost.

That distinction matters because an absolute threshold can conceal deterioration. A target allowed anywhere in the top 25 still technically passes after moving from #11 to #22. Baseline comparison makes that movement visible before a ranking change ships.

## Patterns turn discovery into directed search

*Takeaway: a phrase pattern filters during generation, while result search filters phrases already found.*

Sometimes you are not asking the engine to invent anything. You already suspect that the result begins with “THE FINE GAME OF” and want to test whether the remaining letters can complete it.

The Phrase pattern field applies that constraint inside the generation step. Its syntax follows the pattern language used by our crossword tools:

- `?` matches one unknown letter;
- `*` matches any number of letters; and
- spaces are ignored when matching letters.

That is different from the search box above the returned results. Result search narrows the phrases already retained in the current 1,200-result set. Phrase pattern narrows the work before those results are determined, which makes it the right tool for finding a particular construction such as “The fine game of nil.”

## Required, preferred, and excluded words

*Takeaway: constraints reserve letters; preferences influence ranking; exclusions remove unwanted vocabulary.*

Natural anagram exploration is rarely a single search. You notice a promising word, reshape the phrase around it, and compare several directions.

Advanced options support that workflow:

- **Required words** reserve their letters and lock them into every returned phrase.
- **Preferred words** increase the ranking of phrases that use them without making them mandatory.
- **Excluded words** prevent unwanted words from appearing.
- **Exclude vulgar words** applies a broader built-in filter for users who want cleaner output.
- **Maximum words** and **shortest word** control phrase shape and search breadth.
- **Search depth** trades speed for a more extensive exploration.

These controls are collapsed by default so the main experience remains approachable. Users who want to direct a difficult search can expand them without turning the default page into a wall of settings.

## The Pick List supports exploration without losing good ideas

*Takeaway: save, compare, and copy promising phrases while continuing to search.*

A strong phrase may appear before the best one. The browser-local Pick List lets you save a result without ending the search. Each saved entry can be copied independently, and Focus mode reduces surrounding page furniture when you want to concentrate on the workbench.

The result list is paged in groups of 120. Pattern-aware result search applies across the complete retained set rather than only the visible page, so a phrase on a later page does not disappear simply because it is not among the first cards on screen.

We deliberately did not add a one-click copy of all 1,200 results. Sending a large candidate set to an AI system can be useful for a separate editorial pass, but it also creates a confusing clipboard payload and can encourage users to share phrases they intended to keep local. Copying selected results from the Pick List keeps that choice explicit.

## Browser-local by design

*Takeaway: the phrase, constraints, and generated candidates remain on the device.*

The dictionaries, ranking data, JavaScript workers, and WebAssembly module are static assets. After they load, the computation occurs in the browser. MonkeyTactics does not need an anagram-search API that receives the name or phrase.

This matters because people often test names, private jokes, draft headlines, unpublished projects, and other text they may not want added to a server log. Local execution also avoids a network round trip during the search and lets desktop hardware contribute multiple worker cores directly.

The tradeoff is that the browser must download the language data and perform the computation. We split larger ranking files into deployment-friendly compressed shards, lazy-load what the tool needs, and version asset URLs so a new release does not accidentally reuse incompatible cached data.

## How to use Anagram Architect

1. Enter a name or phrase. Spaces, punctuation, and capitalization are ignored for letter accounting.
2. Select **Architect anagrams** for a broad ranked search.
3. Open **Advanced options** when you want a phrase pattern, required or preferred vocabulary, exclusions, a different dictionary, or a deeper search.
4. Watch the live analysis panel for worker progress, throughput, exact combinations, and the current leader.
5. Search the retained results with words or a wildcard pattern.
6. Add promising phrases to the Pick List and copy the ones you want to keep.

[Try Anagram Architect →](https://monkeytactics.com/tools/anagram-architect)

## What we learned

The central lesson was that generating exact combinations and ranking language are different engineering problems.

Rust/WASM makes the constrained search fast. Workers make it practical in a web page. Dictionaries provide vocabulary. But the experience becomes useful only when phrase order, familiarity, grammatical shape, and human taste influence what reaches the top.

Four decisions made the biggest difference:

- rank complete ordered phrases, not only their component words;
- expose enough live search information to make long searches understandable; and
- give users constraints and a Pick List so they can collaborate with the engine instead of accepting one opaque answer.
- measure rank and search-cost regressions against a stable benchmark baseline.

## What comes next

Anagram Architect is already capable of finding exact phrases that a simpler word-combination solver would bury. It is not the end of the ranking problem.

Future improvements can make better use of named entities, idioms, semantic themes, and broader license-compatible phrase evidence. The benchmark is now systematic and will continue growing as difficult examples expose new weaknesses.

The long-term goal is straightforward to describe and difficult to achieve: search broadly enough to find the surprising result, then understand language well enough to put that result first.

That is the territory Anagram Architect is designed to explore.
