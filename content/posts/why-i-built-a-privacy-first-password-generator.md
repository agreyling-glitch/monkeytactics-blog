---
title: "Why I Built a Password Generator I Could Actually Trust"
date: 2026-07-30
draft: false
description: "Why ad-supported password generators deserve extra scrutiny, and how I built a transparent, browser-based alternative with the Web Crypto API."
tags: ["passwords", "privacy", "security", "open source", "web development"]
---

A password generator asks for an unusual amount of trust.

You open a page, click a button, and let code written by a stranger create the secret that may protect your email, bank account, cloud storage, or business. The result looks random, but appearances tell you almost nothing. You cannot tell by looking at a password whether it came from a cryptographically secure source, a predictable algorithm, or a short list prepared in advance.

That trust problem is why I built the [MonkeyTactics Password Generator](https://monkeytactics.com/tools/password-generator).

I wanted a generator whose security model I could explain plainly: the password is created on your device, it is not submitted to a backend, and the code that creates it is available for anyone to inspect.

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

## More than one kind of credential

The tool grew beyond a single random-character button. It can create:

- Passwords from 4 to 128 characters
- Batches of up to 30 passwords
- Multi-word passphrases with optional separators, capitalization, and numbers
- Random usernames
- Plus-addressed email aliases
- Addresses for catch-all domains

It also includes options to remove visually similar characters, avoid duplicates, set minimum numbers and symbols, include a word or prefix, estimate entropy, copy results, download a text file, print a password table, and create a QR code for transfer to another trusted device.

The passphrase mode uses bundled ENABLE and SOWPODS word data. Compressed dictionary chunks are fetched by the browser only when the expanded word pool is requested; the finished passphrase is still assembled locally.

QR codes deserve their own warning: a password QR code is a visual copy of the password, not encryption. Anyone who can see or scan it can recover the secret. Use that option only around devices and people you trust, and avoid saving or sharing screenshots.

## Open source turns a promise into something testable

“Trust us” is not a satisfying security feature. The complete MonkeyTactics utilities project is [open source on GitHub](https://github.com/agreyling-glitch/monkeytactics-calculators).

You can inspect the password-generation functions, see the call to `crypto.getRandomValues()`, review the rejection-sampling logic, and search for network requests yourself. Developers can also clone the repository, run the tool locally, test it, or suggest an improvement.

Open source does not magically make software secure. Someone still has to read the code, and the deployed site still has to match it. But public code makes meaningful scrutiny possible. It replaces an unverifiable marketing claim with evidence.

## A transparent note about dependencies

The core password logic is framework-free and does not need a third-party service. The current page does load the MIT-licensed `qrcode` library from jsDelivr for optional QR rendering. That request does not contain a generated password; the library renders the QR code in the browser.

I am calling this out because transparency should apply to the details that complicate the story too. A future improvement would be to serve that pinned library from MonkeyTactics itself and reduce the page's third-party dependency surface even further.

## What this tool does—and does not—solve

A trustworthy generator helps create an unpredictable secret. It cannot protect that secret after you copy it into an unsafe device, reuse it across accounts, paste it into a phishing page, or store it in an unprotected note.

For important accounts:

- Generate a long, unique password for every service.
- Save it in a reputable password manager.
- Enable multi-factor authentication or a passkey when available.
- Treat copied text, downloaded files, printouts, and QR codes as sensitive.

[NIST recommends using a password manager](https://www.nist.gov/cybersecurity-and-privacy/how-do-i-create-good-password) and emphasizes password length. The MonkeyTactics generator is a useful creation tool, not a replacement for secure long-term storage.

## Try it, then verify it

You can use the [MonkeyTactics Password Generator](https://monkeytactics.com/tools/password-generator) without creating an account, and you can inspect the [source code on GitHub](https://github.com/agreyling-glitch/monkeytactics-calculators) before trusting it.

That is the standard I wanted for my own password generator: secure randomness, local processing, a narrow trust boundary, and claims that do not depend on taking my word for them.
