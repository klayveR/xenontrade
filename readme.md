
# XenonTrade
XenonTrade is a Path of Exile trading app based on electron that was developed specifically for linux users. Path of Exile's performance on linux distributions has drastically increased in the past few months, but unfortunately there are barely any trading companions available for linux. The most well known tools that are used on Windows either don't work or are very complicated to get to work. And thus, this app was created. Currently, it is only used for checking prices, but soon it'll receive a trade whisper helper as well.

![](https://i.imgur.com/YMis7CU.png) | ![](https://i.imgur.com/MxIV2Xu.png) | ![](https://i.imgur.com/NK1puEJ.png)
:---:|:---:|:---:

## Contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Build it yourself](#build-it-yourself)
- [Planned features](#planned-features)

## Features
- Press `CTRL+C` while hovering over an item to get the price data in the overlay immediately
- Price checks can be automatically closed after a certain period of time, configurable via the settings menu
- Arrow colors indicates the confidence in the accuracy of the price
  - Green indicates high confidence, yellow is average and red is low or very low

### Item features
- See the price trend graph by clicking the trend button next to the item name
- Switch between value in Chaos Orbs and Exalted Orbs
- The tool automatically detects almost every unique item variant (see [Item variant support](https://github.com/klayveR/xenontrade/blob/master/item-variant-support.md)) as well as 5 and 6 links

### Currency features
- See the price trend graph by clicking the trend button next to the currency name
- Switch between seeing how many Chaos Orbs you'd receive for the currency and how many Chaos Orbs you'd have to pay for your currency
- Check the value of your whole currency stack (available after clicking on the expand button)
- Compare the actual price you'd have to pay for your currency to the calculated price based on how much you'd receive (available after clicking on the expand button)

## Dependencies
It is strongly recommended to install these tools before using this app. The app works without these, but it will be unable to focus Path of Exile, which may cause unwanted behaviour when switching between interacting with the GUI and Path of Exile.

### Linux
- [xdotool](https://www.semicomplete.com/projects/xdotool/)

## Build it yourself
If you want to package this app yourself, [Node.js](https://nodejs.org/en/) and [node-gyp](https://github.com/nodejs/node-gyp) need to be installed on your system.

### Clone the repository  
`git clone https://github.com/klayveR/xenontrade.git`

### Install dependencies and create installers in `dist/`   
**Linux**    
`npm install && npm run dist`

**Windows** (not fully tested)    
`npm install && npm run dist-win`

If you don't trust the executables in `src/modules/resource/executables`, you can get/create them yourself. Get  `nircmd.exe` from the [official NirCmd homepage](http://www.nirsoft.net/utils/nircmd.html). You can create the `poeActive.exe` executable using [ahk2exe](https://autohotkey.com/docs/Scripts.htm#ahk2exe) by choosing `poeActive.ahk` as the input script.

Alternatively, if you simply want to try it out without packaging the app, clone the repository and run `npm start`.

## Planned features
- Fix missing item variants
- Whisper trade helper
- Improve Windows version
  - *To be honest, I don't even know if it works. I don't have a Windows installation that is able to run Path of Exile ;) Feedback and bug reports are appreciated.*
- Automatically minimize window if Path of Exile is not focused
	- *If there's a way. If this does not work, I'll implement an auto-minimize feature after x seconds of XenonTrade inactivity.*
