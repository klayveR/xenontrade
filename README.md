
# XenonTrade
XenonTrade is an electron trading tool that was developed specifically is linux users. Path of Exile's performance on linux distributions has drastically increased in the past few months, but unfortunately there are barely any trading companions available for linux. The most well known tools that are used on Windows either don't work or are very complicated to get to work. And thus, this tool was created.

![Preview](https://i.imgur.com/PFXRex5.png)

## Planned features
- Save window position
- Whisper trade helper
- Windows release
  - *This tool currently works on Windows, but there are some problems with it not being always on top. A release will follow shortly, some more testing needs to be done first.*
- Automatically minimize window if Path of Exile is not focused
	- *If it works, that is. If this does not work, I'll implement an auto-minimize feature after x seconds of XenonTrade inactivity.*

## Dependencies
### Linux
- [xdotool](https://www.semicomplete.com/projects/xdotool/) - *The tool works without this, but it will be unable to focus Path of Exile*

### Windows
- [NirCmd](http://www.nirsoft.net/utils/nircmd.html) - *The tool works without this, but it will be unable to focus Path of Exile*
  - Choose `Yes` if the installer asks you to copy NirCmd into the Windows directory.

## Build it yourself
If you want to package this app yourself, NodeJS needs to be installed.

- Clone the repository
`git clone https://github.com/klayveR/xenontrade.git`
- Install dependencies
`npm install`
-  Create installers in `dist/`
`npm run dist`

## Item variant support
- **Unique items**
	- ✅ Tombfist
	- ✅ Shroud of the Lightless
	- ✅ Bubonic Trail
	- ✅ Lightpoacher
	- ✅ The Beachhead
	- ✅ Vessel of Vinktar
	- ✅ Yriel's Fostering
	- ✅ Volkuur's Guidance
	- ✅ Impresence
	- ✅ Doryani's Invitation
	- ❌ Atziri's Splendour
- **Gems**
	- Skill and support gems
	    - ✅ Level 20 *(default)*
	    - ✅ Level 21 *corrupted*
	    - ✅ Level 20 Quality +20%
	    - ✅ Level 20 Quality +20% *corrupted*
	    - ✅ Level 20 Quality +23% *corrupted*
	    - ✅ Level 21 Quality +20% *corrupted*
	    - ✅ Level 21 Quality +23% *corrupted*
	    - ✅ Level 1 Quality +20%
	  - Empower/Enhance/Enlighten
		  - ✅ All level and corruption variants
	  - Portal/Detonate Mines
		  - ✅ Level 1


- **Maps**
	- ❌ Maps currently default to the Atlas of Worlds version
