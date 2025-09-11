# SokoMjinga Frontend

Frontend application for **SokoMjinga**, built with [SvelteKit](https://kit.svelte.dev/) and [shadcn-svelte](https://ui.shadcn.com/).

This repo handles the **UI layer** only. It consumes APIs from the [SokoMjinga API](https://github.com/waynemwandi/sokomjinga-api.git).

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```sh
npm install
```

### Development

```sh
npm run dev
```

### Environment Variables

Create a .env file at the project root:

```dotnetcli
PUBLIC_API_BASE=[http://localhost:8000]
```

### Building

```sh
npm run build

npm run preview
```

## Project Structure

- src/ -> routes, lib, components
- static/ -> static assets
- app.css -> global styles

### Start Dev Server

```sh
npm run dev
```
