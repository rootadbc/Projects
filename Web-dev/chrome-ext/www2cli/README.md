# www2CLI

www2CLI is a Chrome extension that adds a Linux-inspired command-line interface on top of the current website.

The original website stays fully visible and interactive. The CLI appears as a floating terminal you can use to navigate, inspect, and extract information from the page.

## Features

- Floating, draggable terminal overlay
- Linux-style command prompt
- List links, headings, and images
- Find text on the page
- Navigate pages and scroll
- Extract text using CSS selectors
- Dark and light terminal themes

## Commands

```text
help
clear
meta
links
headings
images
find <text>
goto <url | link-number>
back
forward
reload
scroll <up | down | top | bottom>
click <selector | link-number>
extract <selector>
theme <dark | light>
close
```

## Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the www2cli folder.

## Privacy

www2CLI does not collect or send your browsing data. It only reads or interacts with the current page when you run a command.

## Author

Created by [@rootadbc](https://github.com/rootadbc)
