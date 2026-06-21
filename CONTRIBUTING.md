# Contributing to StickyShots

Thanks for your interest in improving StickyShots! This guide explains how to contribute.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make the app better.

## Getting Started

### 1. Fork the Repository
Click the **Fork** button on GitHub to create your own copy.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/stickyshots.git
cd stickyshots
```

### 3. Create a Branch
```bash
git checkout -b feature/my-cool-feature
```

Use descriptive names: `feature/...`, `bugfix/...`, `docs/...`

### 4. Install Dependencies
```bash
cd app
npm install

cd ../chrome-extension
# Extension doesn't need npm install (pure JS)
```

### 5. Test Locally
```bash
cd app
npm start
```

Load the extension in Chrome:
- Open `chrome://extensions`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `chrome-extension/` folder

## Making Changes

### Desktop App
- **Main process** → `app/src/main.js`
- **Note UI** → `app/src/note.html` + `note-renderer.js`
- **Library UI** → `app/src/library.html` + `library.js`

### Chrome Extension
- **Context menu & image fetch** → `chrome-extension/background.js`
- **Page injection** → `chrome-extension/content.js`
- **Popup status** → `chrome-extension/popup.html` + `popup.js`

### Guidelines
1. **Keep it simple** — write readable, well-commented code
2. **Test thoroughly** — use the dev tools to debug
3. **No breaking changes** without discussion
4. **Follow the existing style** — use 2-space indentation, const over let

## Testing

### Unit Testing
We don't have unit tests yet, but you can add them! Use Jest or similar.

### Integration Testing
Manually test:
1. Send images from different sites (Google Images, Pinterest, etc.)
2. Test on different OSes if possible
3. Check the library window
4. Test download functionality
5. Test port conflict handling

## Submitting a Pull Request

### 1. Commit Your Changes
```bash
git add .
git commit -m "Add feature X" -m "Detailed description of what changed and why"
```

### 2. Push to Your Fork
```bash
git push origin feature/my-cool-feature
```

### 3. Open a Pull Request
- Go to the original repo
- Click **Pull requests** → **New Pull Request**
- Select your branch
- Fill in the description:
  - What does this change?
  - Why is it needed?
  - Any breaking changes?

### 4. Respond to Feedback
I'll review your PR and might ask for changes. That's normal! Update your branch:

```bash
git add .
git commit -m "Address feedback"
git push
```

The PR automatically updates.

## Types of Contributions

### Bug Fixes
- Found a bug? Open an issue first (let's discuss the fix)
- Then create a PR with the fix
- Include a link to the issue in your PR

### Features
- Have an idea? Open an issue to discuss
- Wait for feedback before implementing
- Once approved, create a PR

### Documentation
- Typos, unclear explanations? Create a PR directly
- New docs? Discuss in an issue first

### Code Quality
- Refactoring, performance improvements, security fixes
- Link to any relevant issues
- Explain why the change is needed

## Common Issues

### "npm install fails"
```bash
rm package-lock.json
npm install
```

### "Extension doesn't load"
- Did you enable **Developer mode** in `chrome://extensions`?
- Try clicking **Reload** on the extension card
- Check the **Errors** section under the extension

### "Port conflict"
```bash
# On Mac/Linux, find what's using the port:
lsof -i :8743

# On Windows:
netstat -ano | findstr :8743
```

### "Dev tools won't open"
Press `F12` in a sticky note window, or right-click → **Inspect**

## Questions?

- **GitHub Issues** — for bugs or feature requests
- **Discussions** — for questions or ideas (coming soon)
- **Email** — hey@aadidoesitbetter.com (for urgent issues)

## Recognition

Contributors get mentioned in:
- Release notes
- GitHub contributors page
- Future landing page (aadidoesitbetter.com)

Thanks for making StickyShots better! 🎉
