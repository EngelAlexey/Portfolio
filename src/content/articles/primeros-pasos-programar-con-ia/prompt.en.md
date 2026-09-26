# Set up this project for working with a coding agent

You are the coding agent running in this repository. Your job is to leave the working environment configured: a project instructions file, a rule that blocks reading secrets, and three reviewers (security, quality and tests) with a skill that runs them on every change.

This text works for any tool. You know which tool you are and where it reads each thing. Wherever this text says "the skills directory" or "the subagents directory", use the one your tool uses. If you are not sure about a path, check your tool's official documentation before writing; do not invent it.

Credits: the reviewers adapt ideas from cloudflare/security-audit-skill (MIT, © 2025-2026 Cloudflare, Inc., https://github.com/cloudflare/security-audit-skill) and affaan-m/ECC (MIT, © 2026 Affaan Mustafa, https://github.com/affaan-m/ECC). Keep this credits line in every reviewer file you generate.

## Rules for the whole task

- Do not install dependencies, plugins or MCP servers. Do not switch on any mode that skips permissions.
- Do not modify application code. You only create agent configuration and documentation files.
- If a file you are about to create already exists, do not overwrite it: show the difference and ask.
- Every command you write into a file has been run in this repository first and has succeeded. If it cannot be run, do not write it.
- Write in the language the repository's documentation uses. If there is none, in the language of this conversation.

## Phase 1. Survey the project (read only)

1. Identify your tool and note three paths: where it reads project instructions, where it reads project skills, and where it reads project subagents, if it supports them.
2. Read whatever manifests exist (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `composer.json`, `Gemfile`, `*.csproj` and equivalents) and the lockfiles. Note the language, runtime version and package manager.
3. Find the real commands to: install, build, run the tests, run a single test, lint, type-check and audit dependencies. Take them from the manifest scripts, the README and continuous integration (`.github/workflows/`, `.gitlab-ci.yml` or equivalent).
4. Run each of those commands once, except install if dependencies are not installed yet: that one is read, not run. Note which succeed, how long they take, and which fail with the exact error. If a command creates or changes files, undo that and say so.
5. Check whether `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md` or any other agent instructions file already exists.
6. Look for files holding secrets or credentials by name: `.env*`, `*.pem`, `*.key`, `secrets.*`, `credentials*`. Do not open them.
7. Read `git log --oneline -20` and note the commit message style.

## Phase 2. Propose and wait

Before writing anything, present:

- a table with every file you will create or modify, its path and one line saying what it is for;
- the commands from phase 1 with their results;
- whatever you could not determine.

Then **stop and ask for confirmation**. Do not continue until you get it. If the answer changes something, apply it to the proposal and present it again.

## Phase 3. Project instructions file

Create `AGENTS.md` at the root. It is the canonical file because several tools read it. Check in the current documentation whether your tool reads it on its own; do not assume from memory (Claude Code, for example, reads it directly from version 2.1.277 when there is no `CLAUDE.md`). If your tool does not read it, or the repository already has your tool's own file, add a line to that file importing `AGENTS.md` with its documented syntax (for example, `@AGENTS.md` in a `CLAUDE.md`), and below it only what is specific to your tool. If an instructions file already exists, do not replace it: propose moving its content into `AGENTS.md` and wait for an answer.

`AGENTS.md` stays under 200 lines and holds only what cannot be worked out by reading the code:

```markdown
# <project name>

## Commands
- Install: <command>
- Tests: <command>            (single test: <command with pattern>)
- Lint: <command>
- Types: <command>
- Dependency audit: <command>

## Environment
- <language and exact version>, <package manager and version>

## Conventions
- <concrete, checkable convention, e.g. "dates are stored in UTC and formatted only in the UI">
- Commit format: <the one the history uses>

## Before calling a task done
1. <test command> exits 0.
2. <lint command> and <type command> finish with no warnings.
3. No dependency was added that the task did not ask for.

## Review
Before committing a change, run the `review-change` skill.
```

Every line is a checkable instruction. "Use 2-space indentation" works; "write clean code" does not. Do not list directories or dependencies.

## Phase 4. Secrets are not read

Add a rule to your tool's permission configuration that denies reading the secret files found in phase 1, at least `.env` and `.env.*`. The rule goes in the configuration the tool enforces, not in `AGENTS.md`: a text instruction is interpreted by the model, a permission rule is enforced by the tool. In Claude Code it is:

```json
{ "permissions": { "deny": ["Read(./.env)", "Read(./.env.*)"] } }
```

in `.claude/settings.json`. In another tool, use its documented equivalent (an ignore file, a permission rule). If your tool has none, say so in the final report instead of replacing it with an instruction. If the rule only covers the read tool and not the terminal, say that too.

Check it: try to read `.env` with your read tool. It has to return a block. Deciding not to read it yourself does not count as a check.

## Phase 5. Three reviewers

Create three skills in the project skills directory, each in its own folder with a `SKILL.md` that follows the Agent Skills open standard (https://agentskills.io/specification): a YAML header with `name` (lowercase letters, digits and hyphens, matching the folder name) and `description` (what it does and when to use it, under 1024 characters), and the instructions below it.

If your tool supports subagents, also create one subagent per reviewer that loads its skill, with read-only access plus command execution (in Claude Code: `.claude/agents/<name>.md` with `tools: Read, Grep, Glob, Bash` and `skills: [<name>]`). A subagent works in its own context window, so each reviewer reads the change without the bias of the conversation that wrote it.

In all three templates, replace `<test command>` and the other placeholders with the real commands from phase 1.

### Shared contract

Copy this block, unchanged, to the top of each reviewer's instructions:

```markdown
## Finding contract

A finding without these five fields is not reported:

- **file:line**, exact.
- **failure**: concrete input or state → what happens → what bad result it produces.
- **severity**: critical, high, medium or low (anchors below).
- **fix**: the smallest change, at the point where the decision is made.
- **checked**: what you ran or read to confirm it, and what it returned.

Before writing a finding, answer yes to all four:
1. Can I cite the exact line?
2. Can I name the input that triggers it and the result?
3. Have I read who calls this code and its tests? Many apparent bugs are already handled one level up.
4. Does the severity hold if someone else challenges it?

If any answer is no or unsure: lower the severity or drop the finding.

- Critical and high require the snippet, the failure scenario, and why existing guards (types, validation, the framework) do not stop it. Without all three, it is medium at most.
- Doubt between a defect and a deliberate decision is low, and the fix starts with "confirm whether…".
- One finding per defect, not per file. Five functions with the same flaw are one finding.
- A false positive costs a change to code that worked. A report with three true findings beats one with fifteen doubtful ones.
- **Zero findings is a valid result.** Do not manufacture findings to justify the review.
- Never report naming, formatting, argument order or prose.
- Review only what the change touches. A pre-existing defect in untouched code is a one-line note, unless it is critical.

## Report

Verdict (clean / with warnings / blocks), a findings table (file:line, severity, one-line failure) and the list of what you ran with its result. Nothing else.

Credits: adapted in part from cloudflare/security-audit-skill (MIT, © 2025-2026 Cloudflare, Inc.) and affaan-m/ECC (MIT, © 2026 Affaan Mustafa).
```

### security-reviewer

```markdown
---
name: security-reviewer
description: Reviews a change for security flaws with real consequences (improper access, injection, exposed secrets, lost data). Use it on the diff before committing, or when asked to review the security of a change.
---

# Security reviewer

Your question is one: **does this change let someone do or see something they should not?**

[paste the shared contract here]

## What a security finding is

A finding crosses a trust boundary and produces a result. For every candidate, name:
who has less trust (an anonymous user, another tenant, external input), what input they control,
which control should stop them, which boundary is crossed, and which resource or person is affected.
Without those five pieces it is not a finding: it is a missing best practice, and that is not reported as a vulnerability.

## What you look for

- Authorization: a route, action or query that does not check who is asking or whether the resource is theirs.
  Hiding a button in the UI is not a permission.
- Injection: input that reaches SQL, a system command, a template or HTML without parameterization.
- Secrets: credentials in the code, in the bundle the browser downloads, or in logs.
- Validation that exists on the client and not on the server.
- Errors that return internal detail (stack traces, queries, paths) to the caller.
- New dependencies: that they exist on the public registry, that the version is pinned, and that the change needs them.
- Data that is lost, overwritten or left half-written; two writes racing without a transaction.

## Severity

- **critical**: without authenticating, someone executes code, reaches the whole data store or takes over other accounts.
- **high**: someone fully defeats an explicit control with real consequences (auth bypass, reading or writing another tenant's data, stored script affecting other users).
- **medium**: a boundary is violated with limited reach or uncommon conditions.
- **low**: non-secret internals are exposed, or the effect takes a lot of effort for little gain.

If you cannot state the concrete damage, the severity is lower than it feels.

## What you do not do

- Do not assume how deployment is configured (proxy, headers, provider). If the finding depends on it, report it as "needs confirmation" with the exact missing fact.
- Do not test against deployed or external services. Source code and local tests only.
- Do not flag `Math.random()` outside cryptography, test credentials in test files, or values in `.env.example`.
- If you see a quality or testing problem, one line of warning and move on: those belong to the other two reviewers.
```

### quality-reviewer

```markdown
---
name: quality-reviewer
description: Reviews whether a change will be maintainable (duplicated primitives, swallowed errors, two halves that must match with nothing comparing them). Use it on the diff before committing. Does not judge security or test strength.
---

# Quality reviewer

Your question is one: **will this change hold up?** You look for the defect that gets paid for months later, not for style.

[paste the shared contract here]

## The six shapes you look for, in this order

1. **The right function already exists and is not used.** The change reimplements something the project already has. Before saying so, search for it (`grep -rn "name" .` or equivalent) and cite where it is.
2. **Two halves that must match and nothing compares them.** Client validation against server validation, database schema against the code writing to it, two UI languages, a type against the real API response. Their similarity is the design; that they can drift apart without anything failing is the defect.
3. **An error that looks like success.** A `catch` returning a default value, "does not exist" and "could not be read" in the same branch, an exit code that is always 0, a field the client sends and the server never reads.
4. **The parameter dropped when delegating.** A function receives an argument and calls another without passing it on.
5. **A number that sets a limit, written in the middle of the code** instead of in configuration. 0, 1, HTTP status codes and constants whose name makes them obvious do not count.
6. **What the change adds without a test.** You only check whether tests exist for the new code; whether they measure well belongs to the tests reviewer.

## False positives you do not report

- "Missing error handling" when the caller or the framework already handles it. Read at least one caller.
- "Missing validation" in an internal function whose callers already validate.
- "Function too long" on an exhaustive `switch`, a test table or configuration.
- "Possible null" when the previous line already rules it out.
- Switching language, library or architecture. You follow the conventions in `AGENTS.md`.

Ask before each one: would an experienced engineer on this team change it in review? If not, do not report it.

## How you measure

Run only the tests for the files the change touches: `<single test command>`. The tests reviewer runs the full suite.
```

### tests-reviewer

```markdown
---
name: tests-reviewer
description: Checks whether a change's tests can actually fail, by mutating the code they defend, and closes the review by merging the three reports. Use it at the end of review-change or when asked to review tests.
---

# Tests reviewer

You are the last of the three. You have two jobs.

[paste the shared contract here]

## Job one: do the tests measure what they claim to?

A test is only accepted once it has been seen to fail. The four shapes of a test that does not measure:

1. **It cannot turn red.** It compares two values from the same source, asserts on an object the test itself just built, or loops over an empty list.
2. **It pins the defect as expected.** Fixing the code would turn the suite red. The worst kind: it blocks the fix and looks like coverage.
3. **It measures its own copy.** The test double computes the result with the same formula as the code, so both are wrong in the same way.
4. **It depends on spelling, not behavior.** Renaming a variable breaks it; changing the behavior does not.

**The tool is mutation.** Change one line of what the diff adds (invert a condition, remove a check, move a limit by one) and run only that file's tests with `<single test command>`. If they stay green, the test does not defend that line: that is a finding. About eight mutations are enough; more only if a specific finding calls for it.

Restore each mutation with `git show HEAD:<path> > <path>`. **Never** with `git checkout --` or `git restore`, which also discard uncommitted changes that are not yours. If the file is not committed yet, save a copy before mutating and restore from that copy.

Edge cases that should have a test when the change touches them: null or empty input, wrong type, boundary values, the error path (network, disk, database), special characters.

A weak test blocks only if what it fails to measure is introduced by this change and its failure would do real damage. A gap that already existed is a warning.

## Job two: take apart what the other two approved

Read the security-reviewer and quality-reviewer reports and distrust them:

- What they called correct: open the file at the cited line and check it.
- What they considered covered "because it has a test": does that test bite?
- A finding of theirs that does not hold: lower it or remove it, and say why.

## The suite

Run the full suite once, at the end: `<test command>`, and `<type command>` if there is one. Record the exact numbers.

## Verdict

Merge the findings of all three into one report. It **blocks** if there is any critical or high, or a medium from security or tests. Everything else is a warning.
```

## Phase 6. The skill that runs the review

Create the `review-change` skill:

```markdown
---
name: review-change
description: Reviews the current change in three phases (security, quality, tests) before committing it or opening a pull request. Use it when asked to review a change, a diff or a branch.
---

# Review a change

1. Get the change: if there are uncommitted changes, `git add -A && git diff --cached`; otherwise `git diff <base branch>...HEAD`. List the files with `--stat`, new ones included.
2. If there are no changes, say so and stop.
3. Run security-reviewer and quality-reviewer on that diff. If your tool supports subagents, in parallel and each in its own context; otherwise one after the other.
4. When both finish, run tests-reviewer with the diff and both reports.
5. Show the final verdict and the findings table. Do not fix anything unless asked: the report is the product.
```

## Phase 7. Check and close

1. Check that all four skills show up in your tool (in Claude Code, by typing `/` in the session) and that each header is valid.
2. Check the secrets rule from phase 4 again.
3. Create a small, throwaway test change, for example a function with an empty `catch` that returns `[]`, in a new file. Run `review-change` on it and check that the quality reviewer flags it. Then delete that file and confirm with `git status --porcelain` that the tree is back to how it was.
4. Finish with a short report: the list of files created, the commands left in `AGENTS.md` with their result, whatever could not be configured in your tool and why, and how to run the review (`/review-change` or its equivalent).
