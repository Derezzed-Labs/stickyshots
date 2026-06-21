# Chrome Web Store Submission Guide

This guide walks you through submitting StickyShots to the Chrome Web Store so anyone can install it with one click.

## Prerequisites

1. **Chrome Developer Account** — [register here](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
2. **Extension files** — all files in the `chrome-extension/` folder
3. **Marketing assets** — icons, screenshots, descriptions (below)

## Step 1: Prepare Your Extension

Your extension folder should have:
```
chrome-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

### Create a Zip File

```bash
cd chrome-extension
zip -r ../stickyshots-extension.zip .
```

## Step 2: Create Store Assets

### 1. **Icon (128×128 PNG)**
Your current `icon128.png` works. Make sure it's:
- PNG format
- 128×128 pixels
- Clear, recognizable at small sizes
- No transparency issues

### 2. **Screenshots (1280×800 PNG)**
Create 1–5 screenshots showing:

**Screenshot 1: Main Feature**
- Show a sticky note floating on a desktop with other apps in background
- Demonstrate the draggable aspect

**Screenshot 2: Library Window**
- Show the "Open Library" with multiple images
- Demonstrate organization

**Screenshot 3: Easy to Use**
- Show the right-click context menu on an image
- Text: "Right-click any image → Send to StickyShots"

### 3. **Promo Tile (440×280 PNG)**
This appears on the store listing. Create a clean graphic with:
- StickyShots logo/name
- "Free" badge
- One image floating on a desktop background

### 4. **Marquee Tile (1400×560 PNG)**
Hero image at the top of your store page. Show:
- The app in action
- Desktop floating notes
- "Drag images onto any app"

## Step 3: Write Store Copy

### Extension Name
```
StickyShots — Send to Sticky Note
```

### Short Description (132 characters max)
```
Float any image as a draggable sticky note on your desktop. Right-click, send, and drag anywhere.
```

### Full Description
```
StickyShots lets you send any image from the web straight to your desktop as a floating, 
draggable sticky note. Perfect for reference images, inspiration boards, or quick visual lookups.

FEATURES:
• Right-click any image → "Send to StickyShots"
• Floats above every app, even fullscreen games
• Auto-fits to image size
• Drag, resize, lock position, duplicate, download
• Session-based library — images clear when you close the app
• Completely private — zero network requests, no tracking

HOW IT WORKS:
1. Install the Chrome extension
2. Download and run the StickyShots desktop app (Windows, Mac, Linux)
3. Keep the app running in your system tray
4. Right-click any image → "Send to StickyShots"

PRIVACY:
All images stay on your machine. No cloud, no accounts, no telemetry. Just images floating on your desktop.

REQUIRES:
• Chrome browser
• StickyShots desktop app (free, download from GitHub)

Open source on GitHub: https://github.com/aadidoesitbetter/stickyshots
```

### Permissions Justification
You'll be asked why you need each permission:

**`contextMenus`**
- Used to add "Send to StickyShots" to the right-click menu on images

**`notifications`**
- Used to notify the user when images are sent or if the app is not running

**`host_permissions` (`http://127.0.0.1/*`)**
- Used to communicate with the local StickyShots desktop app (runs on `127.0.0.1:8743`)

## Step 4: Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload your `stickyshots-extension.zip`
4. Fill in all fields:
   - **Name**: StickyShots — Send to Sticky Note
   - **Short description**: (from above)
   - **Detailed description**: (from above)
   - **Category**: Productivity
   - **Language**: English
5. **Upload assets**:
   - 128×128 icon
   - At least one 1280×800 screenshot
   - 440×280 promo tile (optional but recommended)
   - 1400×560 marquee tile (optional but recommended)
6. **Content rating** (IARC questionnaire):
   - Answer the questions (should all be "No" for StickyShots)
7. **Pricing**: Free
8. Click **"Submit for Review"**

## Step 5: Review Process

Google will review your extension (usually 1–3 days). They check for:
- Malware/suspicious behavior ✅ (you're safe)
- Permission misuse ✅ (all justified)
- User data handling ✅ (completely local)
- Chrome Web Store policies ✅ (no violations)

Once approved, your extension is live!

## After Launch

### Update Your GitHub

Add a link to the Chrome Web Store:

```markdown
## Installation

### Chrome Extension
- [**Install from Chrome Web Store**](https://chrome.google.com/webstore/detail/stickyshots/XXX) (just one click!)
- Or load unpacked from source (see "Build from Source")

### Desktop App
- Download from [GitHub Releases](https://github.com/aadidoesitbetter/stickyshots/releases)
```

### Monitor Reviews

Users can leave reviews on the Chrome Web Store. Monitor and respond to feedback:
- Reply to positive reviews with gratitude
- Respond to negative reviews with solutions

## Troubleshooting

### "Extension was rejected"
- Check Google's rejection email for specific reason
- Common issues: unclear permissions, misleading description, unsafe content
- Fix and resubmit

### "My extension isn't showing up in search"
- New extensions need time to index (up to 1 week)
- Try searching for your full name first
- Check that all store fields are filled out

### "Users can't install"
- Ensure the extension is listed as "Public" (not "Unlisted")
- Check that your developer account is in good standing
- Verify the extension version in `manifest.json` is correct

---

**Support**: If you hit issues, reply to Google's email or check the [Chrome Web Store FAQ](https://support.google.com/chrome_webstore/answer/3206646).
