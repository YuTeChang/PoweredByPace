# VibeBadminton Screenshots

This directory contains screenshots and documentation for the VibeBadminton application.

## Screenshot Locations

### Test Results (Latest)
All current screenshots from automated testing are located in:
- **[test-results/](test-results/)** - Latest screenshots from automated testing

These screenshots are automatically generated and include:
- Home page
- Create session (empty, filled, with round robin)
- Session stats (empty and with games)
- Record tab (empty, teams selected, ready to save)
- History tab
- Summary page

See [test-results/README.md](test-results/README.md) for the complete list.

## Documentation

- **[README_TEST_RESULTS.md](README_TEST_RESULTS.md)** - How to generate screenshots
- **[MANUAL_TEST_GUIDE.md](MANUAL_TEST_GUIDE.md)** - Manual testing guide
- **[SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)** - Screenshot capture guide

## Design System

All pages follow the Japandi/Scandi minimal design system:
- Warm off-white background (#F7F2EA)
- Camel/wood accent color (#D3A676) for primary actions
- Rounded cards with soft shadows
- Generous whitespace and clean typography
- Mobile-first responsive design

## Generating Screenshots

### Automated Method (Recommended)

Run the automated screenshot test:
```bash
npm run test:screenshots
```

This will capture all screenshots and save them to `test-results/`.

### Manual Method

See [MANUAL_TEST_GUIDE.md](MANUAL_TEST_GUIDE.md) for step-by-step instructions.

