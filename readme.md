
# XenonTrade
XenonTrade is a Path of Exile trading app based on electron that was developed specifically for Linux users. Path of Exile's performance on Linux distributions has drastically increased in the past few months, but unfortunately there are barely any trading companions available for Linux. The most well known tools that are used on Windows either don't work or are very complicated to get to work. And thus, this app was created. Currently, it is only used for checking prices, but soon it'll receive a trade whisper helper as well.

![](https://i.imgur.com/4Yvnygy.png) | ![](https://i.imgur.com/84B7eTl.png) | ![](https://i.imgur.com/0l2mRgv.png)
:---:|:---:|:---:

## Dependencies
It is strongly recommended to install the following dependencies for your operating system. XenonTrade works without them, but it will not include some convenient features.

##### Linux
- [xdotool](https://www.semicomplete.com/projects/xdotool/)
  - Required for focusing the Path of Exile window

##### Windows
- [Python 3](https://www.python.org/downloads/windows/) (*Recommended: Python 3.7 or higher*)
  - Required for automatically minimizing XenonTrade when Path of Exile is not in focus
  - Python must be added to environment variables. If you already installed Python 3, simply download and start the installer again and follow these steps: `Modify` > `Next` > Check `Add Python to environment variables` > `Install`

## Features
- Press `CTRL+C` while hovering over an item to get the price data in the overlay immediately
- Price checks can be automatically closed after a certain period of time, configurable via the settings menu
- Arrow colors indicates the confidence in the accuracy of the price
  - Green indicates high confidence, yellow is average and red is low or very low

##### Item features
- See the price trend graph by clicking the trend button next to the item name
- Switch between value in Chaos Orbs and Exalted Orbs
- The tool automatically detects almost every unique item variant (see [Item variant support](https://github.com/klayveR/xenontrade/blob/master/item-variant-support.md)) as well as 5 and 6 links

##### Currency features
- See the price trend graph by clicking the trend button next to the currency name
- Switch between seeing how many Chaos Orbs you'd receive for the currency and how many Chaos Orbs you'd have to pay for your currency
- Check the value of your whole currency stack (available after clicking on the expand button)
- Compare the actual price you'd have to pay for your currency to the calculated price based on how much you'd receive (available after clicking on the expand button)

## Planned features
- Add support for missing item variants
- Whisper trade helper

## Build it yourself
If you want to package this app yourself, [Node.js](https://nodejs.org/en/) and [node-gyp](https://github.com/nodejs/node-gyp) need to be installed on your system.

##### Clone the repository  
`git clone https://github.com/klayveR/xenontrade.git`

If you want to try it out without packaging the app, you can simply run `npm start` now.

##### Install dependencies and create installers in `dist/`   
###### Linux  
`npm install && npm run dist`

###### Windows (not fully tested)
`npm install && npm run dist-win`

If you don't trust the executables in `src/resource/executables`, you can get them yourself.    
- Get `nircmdc.exe` from the [official NirCmd homepage](http://www.nirsoft.net/utils/nircmd.html). Rename the 64-bit version to `nircmdc64.exe`.
