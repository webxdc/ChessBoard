# Chess Board [![CI](https://github.com/webxdc/ChessBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/webxdc/ChessBoard/actions/workflows/ci.yml) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A WebXDC chess game for two human players and many observers.

<img width=200 src=https://user-images.githubusercontent.com/9800740/170771375-74f8b87d-e47d-4339-bbf3-3bdbfd5a7cd8.png>

[Download the latest version](https://github.com/webxdc/ChessBoard/releases/latest/download/ChessBoard.xdc), attach to a Delta Chat (or other [WebXDC-capable](https://webxdc.org) client) group or direct chat and play chess!

## Developing

### Installing Dependencies

After cloning this repo, install dependecies:

```
npm install
```

### Running tests

```
npm run typecheck
npm run format:check
npm test
```

### Testing the app in the browser

To test your work in your browser (with hot reloading!) while developing:

```
npm run dev-mini
# Alternatively to test in a more advanced WebXDC emulator:
npm run dev
```

### Building

To package the WebXDC file:

```
npm run build
```

To package the WebXDC with developer tools inside to debug in Delta Chat, set the `NODE_ENV`
environment variable to "debug":

```
NODE_ENV=debug npm run build
```

The resulting optimized `.xdc` file is saved in `dist-xdc/` folder.

### Releasing

To automatically build and create a new GitHub release with the `.xdc` file:

```
git tag -a v1.0.1
git push origin v1.0.1
```

## License

Licensed GPLv3+, see the LICENSE file for details.

The chess pieces images are licensed under the `Creative Commons Attribution-Share Alike 3.0 Unported` license and were taken from:
https://en.wikipedia.org/wiki/User:Cburnett/GFDL_images/Chess
