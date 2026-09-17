# Contributing to Thotsakan Mail Engine (ทศกัณฐ์)

First off, thank you for considering contributing to Thotsakan Mail Engine! We welcome community contributions to help make this enterprise email dispatcher the fastest, most reliable, and most cost-effective solution in the world.

---

## 🛠️ Development Setup

Thotsakan is built with **Bun** (v1.4.2+) for blazingly fast execution, integrated SQLite WAL mode, and lightweight RAM footprint (< 40MB).

### 1. Prerequisites
- [Bun 1.4.2+](https://bun.sh/)
- Git

### 2. Clone & Install
```bash
git clone https://github.com/thabot/thotsakan-mail.git
cd thotsakan-mail
bun install
```

### 3. Run Development Server
```bash
cp .env.example .env
bun run src/index.ts
```
The server will boot on `http://localhost:3000` with the Web Console and Swagger API Docs (`/docs`).

---

## 🌿 Git Branching Policy

- **Active Development Branch:** `uat`
  All feature branches, fixes, and Pull Requests MUST be targeted to the `uat` branch.
- **Production Stable Branch:** `main`
  Direct commits to `main` are strictly forbidden. Changes are merged into `main` only after 100% automated test verification and staging validation.

---

## 🧪 Testing & Verification Requirements

Before submitting any Pull Request, you must verify:
1. **100% Automated Test Pass Rate:**
   ```bash
   bun test
   ```
2. **Zero TypeScript Errors:**
   ```bash
   bun x tsc --noEmit
   ```

---

## 📋 Code of Conduct
Please be respectful and constructive in all community interactions.
