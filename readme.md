
# ![](https://i.imgur.com/wVnDg8C.png) XenonTrade
**XenonTrade is a Path of Exile trading overlay**, initially developed specifically for Linux users. While Path of Exiles performance on Linux has drastically increased in the past few months, there are barely any trading companions available for Linux. And thus, this app was created.

Works on **Windows** and **Linux**. Check out the [Installation](https://github.com/klayveR/xenontrade/wiki/Installation) page on the Wiki to get started! If you're facing a problem, take a look at the [Help](https://github.com/klayveR/xenontrade/wiki/Help) wiki.

Price Check | Trade Helper
:---:|:---:
![](https://i.imgur.com/R4MO5Ju.png) | ![](https://i.imgur.com/bewwuVQ.png)

## Wiki

Check out the wiki to learn more about this app!

- [Build it yourself](https://github.com/klayveR/xenontrade/wiki/Build-it-yourself)
- [Button functions](https://github.com/klayveR/xenontrade/wiki/Button-functions)
- [Item variant support](https://github.com/klayveR/xenontrade/wiki/Item-variant-support)

## Features
- XenonTrade is an overlay you can drag anywhere, on top of the game, on your second monitor, wherever you want it to be
- Automatically minimizes when Path of Exile is not in focus or only the menu bar is showing
- Supports higher resolutions (e.g. 4k) thanks to the scale factor setting

### Price check
- Press `CTRL+C` while hovering over an item to price check it
- **[poeprices.info](https://poeprices.info/) integration**, get price predictions for your rare items
	- Prediction explanation by clicking the expand button
	- Easy way of leaving feedback for the predicted price
- **[poe.ninja](https://poe.ninja/) integration**, get the price of non-rare items
	- Supports uniques, currencies, fragments, resonators, fossils, divination cards, prophecies, essences, gems and maps
	- Unique item variants (e.g. Atziri's Splendour) are automatically detected
	- Gem level and quality is taken into consideration as best as possible
	- Quick access to the price trend graph and price confidence levels
	- Switch between Chaos Orb and Exalted Orb price for items valued over 1 Exalted Orb
	- Easily get the value of your whole currency stack by clicking the expand button
- Price check entries can automatically be closed after a configurable amount of time
	- To override the auto-close feature for valuable items you can set a value threshold
	- Auto-close can be cancelled by clicking on the countdown timer

### Whisper helper
- Manage incoming and outgoing trades in the overlay
- Convenient buttons for party management, starting the trade and visiting the trade partners hideout
- Customization options
	- Custom response buttons
		- Placeholders (e.g. `%league%` or `%trade%`) in your response messages will be replaced with the correct data
		- [Font Awesome](https://fontawesome.com/icons?d=gallery) icons as button labels


## Acknowledgments
- [poeprices.info](https://poeprices.info/) for providing their great machine learning price prediction service
- [poe.ninja](https://poe.ninja) for the phenomenal price API
