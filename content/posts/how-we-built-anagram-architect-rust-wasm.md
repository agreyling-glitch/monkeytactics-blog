---
title: "How We Built Anagram Architect: Meaningful Anagrams with Rust and WebAssembly"
seoTitle: "Anagram Generator Built With Rust & WASM"
date: 2026-09-12
lastmod: 2026-09-19
draft: false
description: "See how Anagram Architect uses Rust, WebAssembly, importable recipes, Phrase Studio editing, and local animated reveals to build and share exact anagrams."
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
- **Harry Potter and the Order of the Phoenix** → **Portrayed orphaned hero for the next hit**

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

A deep anagram search is exactly the kind of computation that can make a page appear unresponsive if it runs directly beside the interface. Anagram Architect distributes the work across multiple Web Workers so separate parts of the candidate space can be explored concurrently.

Each worker loads the WASM engine. Rather than giving every worker an identical job, the current search plan assigns complementary roles: a short-phrase specialist, a compact-phrase specialist, and one or more general workers covering separate shards of the broader candidate space. The interface labels those roles and remains available to update progress, show a current leader, graph throughput, and respond to cancellation.

The live analysis panel reports useful signals while the search is running:

- estimated search completion;
- branches evaluated per second;
- exact combinations discovered;
- strongest candidates retained;
- progress for each worker;
- duplicate paths pruned; and
- the current leading phrase.

These measurements are more honest than an indeterminate spinner. A search can show that the engine is advancing instead of leaving the user to wonder whether it stalled. Quick, Deep, and Exhaustive searches also have hardware-adjusted wall-clock budgets of approximately 15, 30, and 60 seconds on a high-capacity device. When a budget is reached, the workers stop and the strongest results discovered so far are retained.

That last distinction is important: a time-limited search returning no results means that it did not discover a result within its allocated work. It does not prove that no exact phrase exists.

## Pro mode extends the search to 60 letters

*Takeaway: longer phrases are possible, but they need explicit limits and clearer expectations.*

Standard mode accepts source phrases containing **2 to 30 letters**. Experimental Pro mode extends that range to **31–60 letters** and reveals higher maximum-word settings for longer constructions.

Before a Pro search begins, the interface checks the logical processor count and the browser's approximate device-memory signal when available. That profile influences the number of workers, node allowance, and time budget. It is guidance rather than a hardware benchmark, but it prevents a low-capacity device and a desktop workstation from receiving an identical workload.

The title **Harry Potter and the Order of the Phoenix** is a useful example. Its exact anagram, **Portrayed orphaned hero for the next hit**, contains seven words and 34 letters. Finding it requires Pro mode and a maximum-word setting of at least seven. If the full result is already known, entering it as an exact Phrase pattern verifies it directly instead of asking a ranked search to rediscover it.

Pro mode does not attempt to enumerate the full combinatorial space. It is a bounded, ranked discovery pass that keeps useful partial results, reports when its budget is reached, and lets the user tighten the search with known words or a phrase structure.

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

## Grammar templates give a phrase a useful shape

*Takeaway: grammar templates direct the search toward familiar constructions without requiring you to spell out every word.*

A letter pattern is useful when you know part of the answer. A grammar template helps when you know how the answer should sound. Anagram Architect can guide generation toward structures such as **[Noun] of [Noun]**, **[Verb] the [Noun]**, **[Adjective] [Noun]**, and **[Noun] in the [Noun]**. These presets now appear as visual phrase blueprints instead of a plain text menu.

Literal connector words such as “of,” “the,” and “in” are reserved automatically. The remaining letter inventory is then searched for words whose likely parts of speech fit the open slots. The result is still validated as an exact anagram; the template changes which valid phrases the engine explores and retains.

When a preset is too general, the custom template builder can combine up to ten noun, verb, adjective, unrestricted, or exact-word slots. Slots can be dragged into order, with keyboard movement available as an accessible alternative. Exact words reserve their letters while grammatical slots constrain the remaining vocabulary.

Templates are especially useful when a broad search has found promising vocabulary but not the intended sentence shape. They also make the distinction between generation and editing clearer: templates guide a new search, while the Pick List helps reshape a phrase you have already found.

## Required, preferred, and excluded words

*Takeaway: constraints reserve letters; preferences influence ranking; exclusions remove unwanted vocabulary.*

Natural anagram exploration is rarely a single search. You notice a promising word, reshape the phrase around it, and compare several directions.

Advanced options support that workflow:

- **Required words** reserve their letters and lock them into every returned phrase.
- **Preferred words** increase the ranking of phrases that use them without making them mandatory.
- **Excluded words** prevent unwanted words from appearing.
- **Personal vocabulary** makes up to 500 names, places, technical terms, or topical words available to the solver.
- **Exclude vulgar words** applies a broader built-in filter for users who want cleaner output.
- **Maximum words** and **shortest word** control phrase shape and search breadth.
- **Search depth** trades speed for a more extensive exploration.

These controls are collapsed by default so the main experience remains approachable. Users who want to direct a difficult search can expand them without turning the default page into a wall of settings.

Personal vocabulary is deliberately separate from Required and Preferred. Adding a name makes it eligible when its letters fit the source; it does not force the name into every result or give it an automatic ranking advantage. The interface reports how many personal entries are relevant to the current phrase, and the list is saved only in that browser.

## The Pick List turns results into a phrase workshop

*Takeaway: save promising results, then reorder, lock, replace, and format them without breaking the anagram.*

A strong phrase may appear before the best one. The browser-local Pick List lets you save a result without ending the search. Opening a saved phrase reveals a slide-out editing studio with three focused tools:

- **Reorder** ranks every distinct word-order permutation. Individual words can be frozen in position while the remaining words move around them.
- **Swap word** finds exact-letter alternatives for a selected word, replacing only that word while preserving the complete phrase's letter inventory.
- **Format** applies capitalization presets, word separators, punctuation boundaries, and sentence endings without changing the underlying anagram.

The reorder list expands into the vertical space available in the drawer and becomes internally scrollable when there are more alternatives than the screen can show. A promising order can be applied with a double-click. Formatting updates the saved phrase preview immediately, and every editing mode has a clear close control when you want to return to the entry.

Each saved entry can still be copied independently, and Focus mode reduces surrounding page furniture when you want to concentrate on the workbench.

Every new pick also keeps a versioned discovery recipe: source phrase, search controls, grammar structure, relevant personal vocabulary, runtime details, engine and ranking versions, original rank, and later Phrase Studio edits. The recipe can be inspected as a readable overview or JSON, copied to another browser, restored, or run again. An imported recipe is checked locally for schema compatibility and an exact source-to-result letter match before it reaches the Pick List.

The **Share find** action opens a local animation studio. It can export WebM or a static before-and-after card, but the lightest format is a compact animation URL. Shared links open in a focused 16:9 view containing only the reveal; responsive iframe mode lets sites that permit embeds render the same animation without hosting a large video. Blueprint is the default style, with Wand, Fly, Shuffle, Magnetic, and Typewriter alternatives. The browser maps repeated letters deterministically and renders every frame locally.

The result list is paged in groups of 120. Pattern-aware result search applies across the complete retained set rather than only the visible page, so a phrase on a later page does not disappear simply because it is not among the first cards on screen.

We deliberately did not add a one-click copy of all 1,200 results. Sending a large candidate set to an AI system can be useful for a separate editorial pass, but it also creates a confusing clipboard payload and can encourage users to share phrases they intended to keep local. Copying selected results from the Pick List keeps that choice explicit.

## Browser-local by design

*Takeaway: the phrase, constraints, and generated candidates remain on the device.*

The dictionaries, ranking data, JavaScript workers, and WebAssembly module are static assets. After they load, the computation occurs in the browser. MonkeyTactics does not need an anagram-search API that receives the name or phrase.

This matters because people often test names, private jokes, draft headlines, unpublished projects, and other text they may not want added to a server log. Local execution also avoids a network round trip during the search and lets desktop hardware contribute multiple worker cores directly.

The tradeoff is that the browser must download the language data and perform the computation. We split larger ranking files into deployment-friendly compressed shards, lazy-load what the tool needs, and version asset URLs so a new release does not accidentally reuse incompatible cached data.

Standard mode accepts source phrases containing **2 to 30 letters**. Experimental Pro mode supports **31–60 letters** with hardware-aware worker counts, bounded search budgets, and explicit guidance about the cost of high maximum-word settings. Personal vocabulary and Pick List data are also stored locally in the browser.

## How to use Anagram Architect

1. Enter a name or phrase. Spaces, punctuation, and capitalization are ignored for letter accounting.
2. Select **Architect anagrams** for a broad ranked search.
3. Open **Advanced options** when you want a phrase pattern, a visual or custom grammar template, required or preferred vocabulary, a personal word list, exclusions, a different dictionary, or a deeper search.
4. Watch the live analysis panel for worker progress, throughput, exact combinations, and the current leader.
5. Search the retained results with words or a wildcard pattern.
6. Add promising phrases to the Pick List.
7. Open **Edit** to reorder or lock words, try exact-letter replacements, and apply capitalization or punctuation.
8. Copy the finished phrase, copy its reproducible recipe, or use **Share find** to create a focused animated reveal.
9. To reproduce a shared find, choose **Import recipe**, paste its JSON or select the recipe file, review the validated preview, and then restore its settings or run it again.

For a source containing more than 30 letters, enable **Pro mode** and choose a realistic maximum word count before starting. If you already know the complete destination phrase, enter it in **Phrase pattern** for a direct exact check rather than spending the discovery budget on a broad search.

[Try Anagram Architect →](https://monkeytactics.com/tools/anagram-architect)

## What we learned

The central lesson was that generating exact combinations and ranking language are different engineering problems.

Rust/WASM makes the constrained search fast. Workers make it practical in a web page. Dictionaries provide vocabulary. But the experience becomes useful only when phrase order, familiarity, grammatical shape, and human taste influence what reaches the top.

Five decisions made the biggest difference:

- rank complete ordered phrases, not only their component words;
- expose enough live search information to make long searches understandable;
- enforce wall-clock budgets and preserve the best results discovered before time expires;
- give users constraints and a Pick List so they can collaborate with the engine instead of accepting one opaque answer; and
- measure rank and search-cost regressions against a stable benchmark baseline.

## What comes next

Anagram Architect is already capable of finding exact phrases that a simpler word-combination solver would bury. It is not the end of the ranking problem.

Future improvements can make better use of named entities, idioms, semantic themes, and broader license-compatible phrase evidence. Constraint-first completion is another priority: when required words leave a small remainder, the engine should solve that remainder directly before spending its budget on a broader ranked search. The benchmark will continue growing as difficult long-form examples expose new weaknesses.

The reproducible Pick List recipe, static share card, local animated reveal, standalone Animator, focus-mode links, and iframe embeds are now implemented. The next sharing milestone is an opt-in curated Anagram Hall of Fame at `anagrams.monkeytactics.com`, with attribution, moderation, and permanent discovery pages.

The long-term goal is straightforward to describe and difficult to achieve: search broadly enough to find the surprising result, then understand language well enough to put that result first.

That is the territory Anagram Architect is designed to explore.
