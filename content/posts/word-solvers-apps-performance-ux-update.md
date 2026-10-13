---
title: "Word Unscrambler and WWF Solver: Installable Apps, Smoother Searches"
seoTitle: "Word Unscrambler & WWF Solver: PWA and UX Updates"
date: 2026-10-13
lastmod: 2026-10-13
draft: false
description: "Install the MonkeyTactics word solvers as focused apps, download them for offline use, and explore faster-loading dictionaries, candidate comparison, and Play and refill."
tags: ["words with friends", "scrabble", "word games", "pwa", "offline tools", "solver engineering"]
related_tools:
  - tool: "word-unscrambler"
    priority: 100
  - tool: "words-with-friends-solver"
    priority: 100
slug: "word-solvers-apps-performance-ux-update"
---

A word solver should help you move from a rack of letters to a useful decision without making you wrestle with the interface. You should be able to find candidates, understand their scores, compare what they leave behind, and prepare the next rack.

Our latest updates bring that workflow to the [Word Unscrambler](https://monkeytactics.com/tools/word-unscrambler) and [Words With Friends Solver](https://monkeytactics.com/tools/words-with-friends-solver). Both can be installed as individual apps, open directly in Focus Mode, and support complete offline downloads. Underneath, dictionary loading and searches have changed too, alongside improvements to scoring, filtering, and saved candidates.

## Two solvers, two recognizable apps

The solvers now have separate app identities and icons. Install the one you use most, or install both.

| Word Unscrambler | WWF Solver |
| --- | --- |
| ![Word Unscrambler app icon: cream letter tiles on teal](/images/word-solvers-pwa/word-unscrambler-192.png) | ![WWF Solver app icon: cream scored letter tiles on purple](/images/word-solvers-pwa/words-with-friends-solver-192.png) |
| Scrambled tiles resolving into CAT | Scored tiles arranged on a small board |

Where supported, an **Install** button shows the app's icon beside its name. You can also use your browser's installation menu. On iPhone or iPad, open the solver in Safari and use **Share → Add to Home Screen**; wording and availability depend on the browser and device.

These are Progressive Web Apps, or PWAs: the same web tools presented in their own app windows. You can still use either solver in a normal browser tab.

## Launch straight into the solver

An installed solver should feel like the tool you chose, rather than the whole MonkeyTactics website.

Both installed apps therefore start in **Focus Mode**, with the interactive solver filling the workspace and the surrounding site navigation out of the way. The existing exit control remains available, and Escape exits Focus Mode on a keyboard. A fresh launch defaults to Focus Mode again.

Ordinary browser visits keep the usual page layout. You can enter Focus Mode there whenever you want it.

## Install once, download offline files when you need them

Installation and offline preparation are separate choices. Installing adds the app to your device; enabling **Offline Mode** downloads the complete solver package, including its engine, dictionaries, and local WordNet definitions.

To prepare for use without a connection:

1. Open the solver while online.
2. Enable **Offline Mode** and confirm the download.
3. Wait for the completion message before disconnecting.

Word searches, scoring, hooks, and local definitions remain available from the downloaded package. External dictionary lookups and related online guides are unavailable while Offline Mode is enabled. Browser storage can be cleared or evicted, so a download may occasionally need to be repeated.

You do not need to reinstall for routine updates. Opening or reloading online loads the current deployed solver. If it detects an older offline package, **Update offline files** opens the download confirmation. Unchanged files can be reused, and the previous package is retained if the replacement fails. An app opened entirely offline continues using its downloaded version until you reconnect and update it.

## Less dictionary data, less work before you interact

The Standard dictionary now loads its own ENABLE data instead of downloading the larger combined dataset and filtering it afterward.

Loading every Standard shard transfers roughly **464 KB of compressed dictionary data**, compared with about **2.68 MB** for the combined dataset—approximately **83% less dictionary data** for a search requiring the full index. Those figures describe dictionary transfers, not total app size or a measured reduction in search time. Ordinary rack searches also load relevant letter shards as needed.

Dictionary indexing and searches now run in a **Web Worker**, keeping that computation away from the browser thread responsible for typing, scrolling, and controls. Search time still depends on the device, query, and dictionary; we are not claiming a universal speed multiplier.

Word details also do less work up front. Rack-leave analysis is requested when you inspect a candidate, definitions load when details open, and full hook lookups start when you expand **Available hooks**. Large result sets use pages of 250 matches instead of rendering every match at once.

## Scores that respect blanks and board letters

Blank tiles now contribute zero points consistently across results, score filters, sorting, and saved picks. A question mark represents a blank in your rack.

The separate **Play through board letters** mode distinguishes tiles you hold from letters already on the board. For example:

- **Rack:** `CT`
- **Board pattern:** `?A?`
- **Candidate:** `CAT`

The existing A comes from the board; only C and T come from your rack. An empty board-pattern field falls back to an ordinary rack search.

These are candidate scores before premium squares and cross-word scoring. The solver does not reconstruct a full board or guarantee a legal placement. Each tool uses its own tile values and seven-tile bonus rules.

## Clearer controls and useful recovery

Sorting sits beside the results, alongside quick word-length choices and removable filter chips. Changing a dictionary refreshes the results, and visible dictionary names make the selection easier to understand.

Conflicting constraints now explain themselves and offer a repair action. If a board pattern contains three positions but the length filter requires two letters, the solver can offer to use length three. Basic and Advanced Reset clear their respective filters and refresh the search.

**Clear search** preserves History and the Pick List. Removing saved work belongs in those panels, and the browser's normal refresh shortcut remains available.

Word Details can be pinned open with a click, closed explicitly, or dismissed with Escape. On phones, it uses a bottom sheet. Dictionary-source badges show whether a candidate belongs to ENABLE, Expanded, or both, rather than assuming its source from the selected search mode.

## Compare candidates, then prepare the next rack

Save promising words to the **Pick List**, select **2–4 candidates**, and choose **Compare selected**. The comparison brings together score, tiles used, remaining rack, estimated leave quality, hooks, and dictionary membership.

That helps answer a better question than “Which word scores most?” You can also consider which letters each choice leaves behind. Leave-quality figures are estimates, not a complete board strategy evaluation.

Choose **Play** from Word Details or the Pick List to subtract the rack tiles used, preserve remaining letters and blanks, and enter replacement tiles. **Add tiles & search** prepares the next search. **Undo play** restores the previous rack, board pattern, filters, and sorting if you want to reconsider.

Here, Play updates your local solver workspace. It does not submit a move to Words With Friends or any other game.

## Try a practice rack

Open the [Word Unscrambler](https://monkeytactics.com/tools/word-unscrambler) or [WWF Solver](https://monkeytactics.com/tools/words-with-friends-solver), search a rack, save a few candidates, and compare their remaining tiles. Then try Play and refill to continue the exercise.

Matching and filtering run locally in your browser, and History and Pick List stay in local browser storage. The tools use reference dictionaries rather than an official game dictionary, so acceptance can vary by game, edition, and ruleset.

For practice and post-game review, the result is a more complete workspace: find possibilities, inspect them, compare them, and keep going. If you are using a solver during a game with other people, agree on outside assistance first; our [fair-play guide](/posts/can-words-with-friends-solver-get-you-flagged/) explains that distinction.
