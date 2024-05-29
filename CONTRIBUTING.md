# Contrubution guide
This is a contribution guide for this repository. Recommend to read this before working on the project.

# Branch Organization

- This repo has two long running branch, `main` and `dev`. 
- The two branch are protected.
- All new branch must be on top of or fork from developement branch `dev`.
- All branches submiting to development branch must be tested.

This repo try to keep a clean single straight git history line.

# Pull Requests

- Always start PR creation with `Draft` state.
- Commit should be atomic. 
- It's okay to commit and push frequeuntly to your branch as long as the branch is rebase and commit are squash before PR.
- It's okay to have multiple commits if logical. But must keep squashing to single commit as much as possible for PR reviews efficiency. 
- Recommend to use git commit convention when adding messages to commits but this is not mandatory. [(Read Commit Convention Guide)](https://www.conventionalcommits.org/en/v1.0.0/)
- Make sure your code comply with formatting/linting configs set by the project.
- Branches must be tested at least with smoke test mannually.
- Must include test coverage.
- Must pass CI/CD pipelines.
- Reqularly pull updates from develeopment branch `dev` by `--rebase`.
- Do not merge branches outside of a PR, use rebase.
- Do not submit to `main`.
- Undraft and request for review when ready.

# Formatting
- Uses google typescript prettier settings for the most part.
- `/*prettier-ignore*/` is often used to bypass really long debug code lines, this is a tip, not an instruction.
- Do not abuse `/*prettier-ignore*/`.

## Using `/* prettier-ignore */`

### What is `/* prettier-ignore */`?

`/* prettier-ignore */` is a directive used in Prettier to prevent the code formatter from formatting a specific piece of code. This can be useful when you have lines of code that should remain unchanged for readability, debugging, or other specific reasons.

### When to Use `/* prettier-ignore */`

There are a few common scenarios where you might want to use `/* prettier-ignore */`:

1. **Long Debug Lines**: When you have long lines of code for debugging purposes that you want to keep on a single line for easier readability.
2. **Special Formatting**: When you have specific formatting that you want to maintain that Prettier would otherwise change.
3. **Temporary Code**: When you have temporary code that is meant for testing and you don’t want it to be auto-formatted.

### How to Use `/* prettier-ignore */`

To use `/* prettier-ignore */`, simply place the comment on the line before the code you want to ignore. Here is an example:

#### Example

```javascript
/* prettier-ignore */
if (ShardeumFlags.VerboseLogs) console.log('Lengths of blocks after pruning', Object.keys(blocksByHash).length, Object.keys(readableBlocks).length)
```
