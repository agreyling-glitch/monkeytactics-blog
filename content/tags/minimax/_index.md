---
title: "Minimax"
description: "Practical explanations of minimax search, adversarial decision-making, and solver design."
---

Minimax is a decision-making method for problems where one side tries to maximize its result while another tries to minimize it. These articles explain how that idea applies to adversarial word games and solver design. They cover search choices, worst-case outcomes, pruning possibilities, and the engineering tradeoffs behind useful browser-based solving tools.

In an ordinary puzzle, the answer stays fixed while you gather information. In an adversarial puzzle, the response can steer you toward the least favorable remaining position. Minimax provides a disciplined way to plan for that resistance. Rather than choosing the move with the best lucky outcome, a solver compares the hardest response each move permits and selects the option with the strongest worst-case result.

Follow the examples to see how this abstract idea becomes concrete code, measurable choices, and strategies a human player can understand.
