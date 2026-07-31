# Azure packaging boundary

AZD restores this minimal package with npm before its service hooks run. The `prepackage` hook
then calls `pnpm package:functions` at the workspace root and generates `dist/` with bundled
business code, `host.json` and the runtime-only package manifest.

This boundary avoids publishing `workspace:*` dependencies or the entire monorepo.
