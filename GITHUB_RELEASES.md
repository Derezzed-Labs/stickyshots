# GitHub Releases & CI/CD

This document explains how StickyShots is automatically built and released on GitHub.

## How It Works

Every time you tag a release, GitHub Actions automatically:
1. Builds the Electron app for **Windows**, **Mac**, and **Linux**
2. Creates installers (`.exe`, `.dmg`, `.AppImage`)
3. Packages the source code
4. Uploads everything to a GitHub Release

## Making a Release

### Step 1: Update Version Numbers

Update `package.json` in the `app/` folder:

```json
{
  "version": "1.1.0",
  ...
}
```

Update `manifest.json` in the `chrome-extension/` folder:

```json
{
  "version": "1.1.0",
  ...
}
```

### Step 2: Create a Git Tag

```bash
git add .
git commit -m "Release v1.1.0"
git tag -a v1.1.0 -m "Version 1.1.0 - Added feature X, fixed bug Y"
git push origin main
git push origin v1.1.0
```

### Step 3: GitHub Actions Builds Automatically

Once you push the tag:
1. GitHub Actions workflow triggers automatically
2. Each OS builder runs in parallel (speeds up the process)
3. Artifacts are uploaded to a new Release

Check the progress: **Actions** tab in your GitHub repo

### Step 4: Review the Release

1. Go to **Releases** tab
2. Click on the auto-generated release for `v1.1.0`
3. Verify all files are there:
   - `stickyshots-v1.1.0-windows.exe`
   - `stickyshots-v1.1.0-macos.dmg`
   - `stickyshots-v1.1.0-linux.AppImage`
   - `stickyshots-source-v1.1.0.zip`
4. Edit the release notes and add a description

### Release Notes Template

```markdown
## What's New in v1.1.0

### Features
- ✨ Added feature X
- ✨ Added feature Y

### Bug Fixes
- 🐛 Fixed bug affecting Z
- 🐛 Fixed port conflict on some systems

### Improvements
- 📈 Better error messages
- 📈 Improved performance on low-RAM systems

### Download
- **Windows**: stickyshots-v1.1.0-windows.exe
- **macOS**: stickyshots-v1.1.0-macos.dmg
- **Linux**: stickyshots-v1.1.0-linux.AppImage
- **Source Code**: stickyshots-source-v1.1.0.zip (for developers)

### Installation
1. Download the installer for your OS above
2. Run it and follow the prompts
3. Download and install the Chrome extension from the Chrome Web Store
4. Right-click any image and select "Send to StickyShots"
```

## Troubleshooting Builds

### Build Failed on Windows
Check the **Actions** tab for error logs. Common issues:
- Node.js not installed (should be automatic)
- Missing dependencies — try `npm audit fix --force`
- Code syntax errors — check main.js, preload.js, etc.

### Build Failed on macOS
macOS builds often fail because:
- Code signing issues (you can ignore for personal releases, but needed for distribution)
- Missing dependencies — should auto-install, but check npm output

### Build Failed on Linux
Linux builds fail if:
- Missing build tools (AppImage requires `appimagetool`)
- Usually auto-installed in the GitHub Action, but check logs

## Manual Build (For Testing)

If you want to build locally without pushing a tag:

```bash
cd app

# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

Built files appear in `app/release/`

## Updating the Workflow

If you need to change the build process, edit `.github/workflows/build.yml`:

```yaml
# Example: Change the target Node version
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'  # ← Change this
```

Common customizations:
- **Skip a platform**: Comment out the matrix entry
- **Change artifact names**: Edit the `files:` section
- **Add a new step**: Copy an existing step and modify it

## Using GitHub Releases

### For Users
Clicking the `.exe` / `.dmg` / `.AppImage` downloads and installs the app.

### For Developers
The `stickyshots-source-vX.X.X.zip` contains the full source — perfect for contributors.

## CI/CD Secrets

The workflow uses `GITHUB_TOKEN` (automatically provided by GitHub Actions), so no manual setup needed.

If you add more steps (e.g., uploading to a CDN), you'd add secrets in:
- **Settings** → **Secrets and variables** → **Actions**

## Next: Chrome Web Store Updates

After a GitHub release, manually:
1. Upload the new extension to the Chrome Web Store
2. Update the version number in `chrome-extension/manifest.json`
3. Test locally with `npm start` before uploading

(Could automate this, but requires OAuth tokens and extra setup.)

---

**Questions?** Check the [GitHub Actions documentation](https://docs.github.com/en/actions) or open an issue.
