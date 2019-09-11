# Machi Koro

A simulator for the board game [Machi Koro](https://boardgamegeek.com/boardgame/143884/machi-koro)

## Contents

* Machi Koro game and single-player visualisation using Angular 1
* Machi Koro multi-player (with bad graphics) and zero-player simulation
* Machi Koro command line simulation

## Playing

### Single Player

Nothing is required to play except for a browser. Run `http-server` or similar from root directory.

### Multi-Player

* nothing is required to play except a browser
* navigate to `machi_koro` folder and find `simul.html`

### AI-only Game

* same as Multi-Player

### Simulation

* install `node.js`
* navigate to `machi_koro/js` folder in terminal
* run command-line with `node cmd_line.js`

#### Command-Line Options

* `node cmd_line.js $number_of_iterations [log-level]`
* log-level is optional, but when specified is one of:
    * `-q`      quiet
    * `-v`      verbose

## Development