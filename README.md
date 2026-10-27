# Prompt Enhancer

A Claude Code mod that rewrites a vague prompt into a specific one, then leaves it in the prompt box for you to review before it is sent.

- **Enhance prompt** button in a band above the prompt box. The rewrite replaces your draft in the box; edit it, then **Send**, or **Undo** to get your draft back.
- **`/enhance [prompt]`** rewrites the prompt you pass, or what is in the box.
- **`e:` / `enhance:` prefix**: a prompt sent as `e: fix the bug` is held back, rewritten and put back in the box instead of being sent. Useful for the first message of a desktop chat, where the band is not drawn until the session has started.

The rewrite keeps your intent, states the deliverable, constraints and what "done" looks like, and ends with an `Assumptions:` line where something is ambiguous. It is written by your session's model with the conversation as context; before the first reply (or after `/clear`) it falls back to Haiku, given your `CLAUDE.md` files and the names of your commands and tools.

## Install

At the prompt of a terminal Claude Code session:

```
/plugin install prompt-enhancer --marketplace SYDROUXBA5/prompt-enhancer
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```bash
claude plugin install prompt-enhancer --marketplace SYDROUXBA5/prompt-enhancer
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `SYDROUXBA5/prompt-enhancer`, then **Add plugin**.

## Develop

```bash
claude plugin validate .
claude plugin test .
```
