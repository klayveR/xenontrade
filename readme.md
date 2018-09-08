
# XenonTrade
XenonTrade is a Path of Exile trading app based on electron that was initially developed specifically for Linux users. While Path of Exiles performance on Linux distributions has drastically increased in the past few months, there are barely any trading companions available for Linux. And thus, this app was created. Currently, it is used as an overlay for checking prices, but soon it'll receive a trade whisper helper as well.

Works on **Windows** and **Linux**. Check out the [Installation](https://github.com/klayveR/xenontrade/wiki/Installation) page on the Wiki to get started!

![](https://i.imgur.com/PnT19ux.png) | ![](https://i.imgur.com/GtXL5Fz.png) | ![](https://i.imgur.com/wvfY1DO.png)
:---:|:---:|:---:

## Wiki

Check out the wiki to learn more about this app!

- [Build it yourself](https://github.com/klayveR/xenontrade/wiki/Build-it-yourself)
- [Button functions](https://github.com/klayveR/xenontrade/wiki/Button-functions)
- [Item variant support](https://github.com/klayveR/xenontrade/wiki/Item-variant-support)
- [Planned features and known bugs](https://github.com/klayveR/xenontrade/wiki/Planned-features-and-known-bugs)

## Features
- Press `CTRL+C` while hovering over an item to get the latest price data in the overlay immediately
- Price checks can be automatically closed after a certain period of time, configurable via the settings menu
  - You can exclude expensive items from the auto close feature by setting a threshold
- Color stripe on the left side indicates the confidence in the accuracy of the price
  - Green indicates high confidence, yellow is average and red is low or very low
- See price trend graphs immediately

##### Item features
- Switch between value in Chaos Orbs and Exalted Orbs
- The tool automatically detects almost every unique item variant (see [Item variant support](https://github.com/klayveR/xenontrade/wiki/Item-variant-support)) as well as 5 and 6 links

##### Currency features
- Switch between seeing how many Chaos Orbs you'd receive for the currency and how many Chaos Orbs you'd have to pay for your currency
- Check the value of your whole currency stack (available after clicking on the expand button)
- Compare the actual price you'd have to pay for your currency to the calculated price based on how much you'd receive (available after clicking on the expand button)
