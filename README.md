# Backend Code Challenge  <!-- omit in toc -->

[![License: MIT][license-badge]][license-docs]

A backend interview challenge workspace organized by problem folder. Each
problem is self-contained with its own README, source code, and tests, while
shared tooling and scripts live at the repository root leveraging npm
workspaces.

-   :tada: Each problem is isolated and can be developed and tested independently
-   :tada: A single `npm install` at the root sets up every workspace dependency
-   :tada: Root-level scripts run setup, tests, and builds for any problem
-   :tada: `problem5` ships as a layered Node/TypeScript CRUD API with Prisma

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
```

Running `npm install` at the repository root installs the dependencies for
every workspace. For running and setting up each problem, please read that
problem's own README.

```text
backend-code-challenge/
├── problems/
│   ├── problem4/
│   ├── problem5/
│   └── problem6/
├── package.json
├── package-lock.json
└── README.md
```

## Problems

- `problem4`: algorithm exercise and tests in [problems/problem4](problems/problem4)
- `problem5`: backend CRUD API in [problems/problem5](problems/problem5)
- `problem6`: Score Board API module specification in [problems/problem6](problems/problem6)

`problem5` is a self-contained Node/TypeScript app with its own
`package.json`. `problem6` is a documentation-only deliverable: the Score
Board API module specification ([README.md](problems/problem6/README.md))
plus Mermaid diagram sources in `diagrams/`.

## Building and Testing

All commands are run from the repository root:

| Command | Description |
| ------- | ----------- |
| `npm test` | Run every problem's tests (`problem4` + `problem5`) |
| `npm run test:problem4` | Run the `problem4` algorithm tests |
| `npm run setup:problem5` | Generate the Prisma client and apply migrations for `problem5` |
| `npm run dev:problem5` | Start `problem5` in dev mode (auto-reload via `tsx`) |
| `npm run test:problem5` | Run the `problem5` API tests |
| `npm run build:problem5` | Compile `problem5` TypeScript to `dist/` |
| `npm run start:problem5` | Run the compiled `problem5` server (`dist/server.js`) |

To run `problem5` in production mode:

```bash
npm run build:problem5    # compile TypeScript -> problems/problem5/dist/
npm run start:problem5    # migrate + run the compiled server
```

> `start:problem5` runs the **already-compiled** `dist/server.js` — it does not compile on
> the fly. Always run `build:problem5` first (or after any source change). For iterative
> development use `dev:problem5` instead, which auto-reloads and needs no build step.

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
