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


