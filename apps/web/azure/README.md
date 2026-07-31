# Azure packaging boundary

AZD restores this dependency-free project with npm. The `prepackage` hook builds the Vue
workspace with pnpm and copies the production output into `dist/`.
