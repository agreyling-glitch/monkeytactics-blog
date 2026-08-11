---
title: "Why I Built a Password Generator I Could Actually Trust"
date: 2026-07-30
lastmod: 2026-08-11
draft: false
description: "Why password tools deserve extra scrutiny, and how I built a transparent browser-based generator, analyzer and privacy-preserving breach checker."
tags: ["passwords", "privacy", "security", "open source", "web development"]
---

A password generator asks for an unusual amount of trust.

You open a page, click a button, and let code written by a stranger create the secret that may protect your email, bank account, cloud storage, or business. The result looks random, but appearances tell you almost nothing. You cannot tell by looking at a password whether it came from a cryptographically secure source, a predictable algorithm, or a short list prepared in advance.

That trust problem is why I built the [MonkeyTactics Password Generator](https://monkeytactics.com/tools/password-generator).

I wanted a tool whose security model I could explain plainly: credentials are created and analyzed on your device, they are not submitted to a password backend, and the code that handles them is available for anyone to inspect. The optional breach checker has a deliberately narrower network request that I explain below.

## The problem is not that every online generator is malicious

Most password-generator websites are probably not waiting to steal the next string they produce. The problem is that a visitor usually has no practical way to distinguish a careful implementation from a careless or hostile one.

An online generator can fail its users in several ways:

- It can use a general-purpose random-number function that was never designed for passwords.
- It can send the generated value to a server for processing, logging, or storage.
- It can include analytics, advertising, tag managers, or other third-party JavaScript with access to the page.
- It can make privacy promises that cannot be checked against the code.
- It can be secure today and change silently tomorrow.

Ads deserve particular scrutiny. An advertisement does not automatically make a site unsafe, but an ad-supported page usually adds more companies, scripts, requests, and incentives to collect data. Every additional script is another party the user must trust. [OWASP's guidance on third-party JavaScript](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html) describes the security and privacy risks that come with allowing outside code to run inside a web application.

For a news article or recipe, that may be a trade-off someone accepts. For a page displaying a brand-new password in plain text, I think the trust boundary should be much smaller.

## What could an untrustworthy generator learn?

A page's JavaScript can read and modify the page around it. If a generated password appears in that page, the code running there can potentially read it too.

A malicious generator could transmit the result directly. A less careful site could expose information through analytics events, session-replay software, error reports, or another third-party integration. Cookies and browser fingerprinting can also associate repeat visits with the same browser, although those techniques do not reveal a password by themselves.

The important distinction is between what a site *claims* and what its design makes possible. “We do not save your password” is weaker than a design in which no server is needed to create it in the first place.

## The design goal: keep secret generation in the browser

The MonkeyTactics generator is a client-side web application. When you choose a length, character set, or other option, JavaScript in your browser creates the result. The generated password is not placed in a form submission or sent to a password-generation API.

Visiting any website still involves ordinary network requests to load the page and its assets. The privacy promise here is more precise: **the password, passphrase, username, or email alias you generate is not uploaded as part of the generation process**.

That distinction matters. Security claims should be specific enough to test.

## Why I used the Web Crypto API

The generator is built with semantic HTML5, responsive CSS, and modular vanilla JavaScript. There is no React, Vue, jQuery, or server-side password service between the controls and the result.

For randomness, the application uses the browser's Web Crypto API:

```js
crypto.getRandomValues(new Uint32Array(1));
```

[`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) provides cryptographically strong random values. That makes it suitable for security-sensitive generation in a way that `Math.random()` is not.

The implementation also uses **rejection sampling** when turning random 32-bit values into character or word indexes. A simple remainder operation can favor some outcomes when the random range does not divide evenly by the number of choices. Rejection sampling discards the uneven tail before selecting an item, preventing that modulo bias.

When a password must contain specific kinds of characters, the generator first satisfies those requirements and then uses a crypto-backed Fisher-Yates shuffle to mix them into the result. This avoids predictable placement such as always putting the required number at the end.

## The tool has grown well beyond one password button

The original idea was simple: generate a trustworthy random password without sending it to a server. The current tool keeps that foundation but supports more real-world password rules and workflows.

It can now create:

- Passwords from 4 to 2,048 characters
- Batches of up to 100 passwords
- Three-to-twelve-word passphrases with optional separators, capitalization, numbers, and word filters
- Random word usernames
- Plus-addressed email aliases
- Unique addresses for domains with catch-all email enabled

Password rules include minimum numbers and symbols, selectable character types, removal of visually similar characters, duplicate prevention, an optional inserted word, and required prefixes or suffixes. Batch results appear in a selectable table so one, several, or all passwords can be copied, printed, or downloaded as a TXT file.

The print workflow supports 1 to 30 passwords per page and can add a QR code for each password. QR previews can be exported as PNG or SVG at 72, 300, 600, or 1,200 DPI. A credential preview also provides a larger text view and detailed analytics.

The passphrase mode uses a curated common-word pool by default. If the obscure-word filter is disabled, the browser loads selected compressed chunks of the bundled ENABLE and SOWPODS word data from MonkeyTactics. The finished passphrase is still assembled locally.

QR codes deserve their own warning: a password QR code is a visual copy of the password, not encryption. Anyone who can see or scan it can recover the secret. Use that option only around devices and people you trust, and avoid saving or sharing screenshots.

For a step-by-step explanation of every control, see the [complete Password Generator user guide](/posts/password-generator-user-guide/).

## Adding analysis without uploading the password

The tool now has a **Check my Password** tab and an **Analytics** view for generated credentials. The analysis runs locally as the user types. It reports:

- Estimated strength and entropy
- Password length and number of unique characters
- Lowercase, uppercase, digit, symbol, and Unicode distribution
- Observed Shannon entropy per character compared with a theoretical estimate
- Lightweight uniformity, runs, monobit, and index-of-coincidence diagnostics
- Brute-force time estimates at two hypothetical guessing speeds
- Collision probability for a billion independently generated credentials
- A color-coded character heatmap

Those measurements are meant to explain and compare a password, not certify it. A single password is too small a sample to prove randomness, and an impressive brute-force estimate cannot reveal whether the password was reused, phished, logged, or already exposed.

The important privacy property is that this analysis does not need a server. The password remains in the page running on the user's device.

## A breach check with a deliberately limited request

Known-breach checking cannot be completely offline because the tool needs current data from the Pwned Passwords service. Instead of sending the password, the browser creates its SHA-1 fingerprint locally and sends only the first five characters of that fingerprint.

The service returns a large group of possible suffixes. The browser compares the rest of the fingerprint locally to find an exact match. The complete password and complete fingerprint are never sent to the service.

Anonymous range replies are cached on the device for up to 24 hours so repeat checks do not make unnecessary requests. The cache keeps at most 100 replies and does not store the password, its complete hash, or the exact match that was checked.

This design is often called a **k-anonymity range lookup**. It narrows what the outside service can learn, but it is still important to describe it accurately: selecting **Check for breach** makes a network request containing a five-character hash prefix. A “no match” result means the password was not found in the returned breach data; it does not prove that the password is strong, unique, or safe.

## Open source turns a promise into something testable

“Trust us” is not a satisfying security feature. The complete MonkeyTactics utilities project is [open source on GitHub](https://github.com/agreyling-glitch/monkeytactics-calculators).

You can inspect the password-generation functions, see the call to `crypto.getRandomValues()`, review the rejection-sampling logic, examine the local analytics and breach-prefix implementation, and search for network requests yourself. Developers can also clone the repository, run the tool locally, test it, or suggest an improvement.

Open source does not magically make software secure. Someone still has to read the code, and the deployed site still has to match it. But public code makes meaningful scrutiny possible. It replaces an unverifiable marketing claim with evidence.

## A transparent note about dependencies

The core password logic remains framework-free and does not need a third-party password service. QR generation now uses the MonkeyTactics WebAssembly QR engine served from the same site, rather than loading a QR library from a public CDN. PNG and SVG rendering happens locally in the browser.

The optional expanded passphrase dictionaries are also served as bundled MonkeyTactics assets. The intentional outside request is the Pwned Passwords range lookup, and only when the user selects **Check for breach**. Its five-character prefix, local comparison, and limited anonymous cache are part of the documented design rather than an invisible exception.

## What this tool does—and does not—solve

A trustworthy generator helps create an unpredictable secret. It cannot protect that secret after you copy it into an unsafe device, reuse it across accounts, paste it into a phishing page, or store it in an unprotected note.

For important accounts:

- Generate a long, unique password for every service.
- Save it in a reputable password manager.
- Enable multi-factor authentication or a passkey when available.
- Treat copied text, downloaded files, printouts, and QR codes as sensitive.
- Replace any password that the breach checker reports as exposed, especially anywhere it was reused.

[NIST recommends using a password manager](https://www.nist.gov/cybersecurity-and-privacy/how-do-i-create-good-password) and emphasizes password length. The MonkeyTactics generator is a useful creation tool, not a replacement for secure long-term storage.

## Try it, then verify it

You can use the [MonkeyTactics Password Generator, Analyzer & Breach Checker](https://monkeytactics.com/tools/password-generator) without creating an account, read the [complete user guide](/posts/password-generator-user-guide/), and inspect the [source code on GitHub](https://github.com/agreyling-glitch/monkeytactics-calculators) before trusting it.

That is the standard I wanted for my own password generator: secure randomness, local processing, a narrow trust boundary, and claims that do not depend on taking my word for them.
