# Backend Code Challenge  <!-- omit in toc -->

[![License: MIT][license-badge]][license-docs]

A backend interview challenge workspace organized by problem folder. Each
problem is self-contained with its own README, source code, and tests, while
shared tooling and scripts live at the repository root leveraging npm
workspaces.

-   :tada: Each problem is isolated and can be developed and tested independently
-   :tada: A single `npm install` at the root sets up every workspace dependency
-   :tada: Root-level scripts run setup, tests, and builds for any problem
-   :tada: `problem2` ships as a layered Node/TypeScript CRUD API with Prisma

## Table of Contents  <!-- omit in toc -->

- [Getting Started](#getting-started)
- [Problems](#problems)
- [Building and Testing](#building-and-testing)
- [Contribution Guidelines](#contribution-guidelines)
- [Feedback](#feedback)
- [About](#about)
	- [Maintainers](#maintainers)
	- [Contributors](#contributors)
	- [License](#license)

## Getting Started

```bash
npm install
npm run setup:problem2
```

Running `npm install` at the repository root installs the workspace
dependencies for `problems/problem2`. `npm run setup:problem2` then generates
the Prisma client and applies the committed migrations.

```text
backend-code-challenge/
├── package.json
├── package-lock.json
├── README.md
└── problems/
    ├── problem1/
    ├── problem2/
    └── problem3/
```

## Problems

- `problem1`: algorithm exercise and tests in [problems/problem1](problems/problem1)
- `problem2`: backend CRUD API in [problems/problem2](problems/problem2)
- `problem3`: Score Board API module specification in [problems/problem3](problems/problem3)

`problem2` remains a self-contained Node/TypeScript app with its own
`package.json`. `problem3` is a documentation-only deliverable: the Score
Board API module specification ([README.md](problems/problem3/README.md))
plus Mermaid diagram sources in `diagrams/`.

## Building and Testing

All commands are run from the repository root:

| Command | Description |
| ------- | ----------- |
| `npm test` | Run every problem's tests (`problem1` + `problem2`) |
| `npm run test:problem1` | Run the `problem1` algorithm tests |
| `npm run setup:problem2` | Generate the Prisma client and apply migrations for `problem2` |
| `npm run dev:problem2` | Start `problem2` in dev mode (auto-reload via `tsx`) |
| `npm run test:problem2` | Run the `problem2` API tests |
| `npm run build:problem2` | Compile `problem2` TypeScript to `dist/` |
| `npm run start:problem2` | Run the compiled `problem2` server (`dist/server.js`) |

To run `problem2` in production mode:

```bash
npm run build:problem2    # compile TypeScript -> problems/problem2/dist/
npm run start:problem2    # migrate + run the compiled server
```

> `start:problem2` runs the **already-compiled** `dist/server.js` — it does not compile on
> the fly. Always run `build:problem2` first (or after any source change). For iterative
> development use `dev:problem2` instead, which auto-reloads and needs no build step.

## Contribution Guidelines

This repository is an interview challenge deliverable and is not open for
external contributions. Feel free to fork it for your own use.

## Feedback

You can leave your feedback in the [issues channel][issues].

## About

### Maintainers

- [Tran Tien Dung][profile]

### Contributors

- [Tran Tien Dung][profile]

### License

[![License: MIT][license-badge]][license-docs]

Distributed under the [MIT License](LICENSE).

[license-docs]: LICENSE
[license-badge]: https://img.shields.io/badge/License-MIT-informational
[profile]: https://github.com/trandung1601
[issues]: https://github.com/trandung1601/backend-code-challenge/issues
