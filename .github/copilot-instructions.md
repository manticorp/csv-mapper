---
applyTo: "**"
description: "CSV dynamic remapping library"
---

This library is intended for distribution via NPM and in browser.

# Code style

Code should follow clean coding guidelines:

- Single responsibility principle
- Clearly named functions and variables
- Consistent formatting and indentation
- Few code explainer comments; it should be clear what it does from the code itself
- Make variable names descriptive, e.g. ```validationType``` instead of ```t```
- Demos should use Bulma CSS classes and include our css/main.css file:
    ```<link href="css/main.css" rel="stylesheet">```

# Running and Creating Demos

Tests are located in the demo folder.

To demo as a module, the server folder should be used. You can start a server by navigating to the folder and running:

```bash
npm run start
```

If a server is already running it will error, but that's fine, you can just use that instead.

# Testing functionality

When you write a piece of functionality, please test is using the Playwright MCP framework.

You do not need to spin up the server every time - you can use File urls, e.g.:

```await page.goto('file:///C:/Users/my-name/csv-mapper/demo/mapping-modes.html');```