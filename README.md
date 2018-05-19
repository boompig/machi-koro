# Contents

* Machi Koro game and single-player visualisation
* Machi Koro multi-player (with bad graphics) and zero-player simulation
* Machi Koro command line simulation

# Installation

* `bower install`
* `make`
  * compiles scss files into CSS

# Playing

## Single Player

* nothing is required to play except for a browser
* navigate to `machi_koro` folder in browser and play

## Multi-Player

* nothing is required to play except a browser
* navigate to `machi_koro` folder and find `simul.html`

## AI-only Game

* same as Multi-Player

## Simulation

* install `node.js`
* navigate to `machi_koro/js` folder in terminal
* run command-line with `node cmd_line.js`

### Command-Line Options

* `node cmd_line.js $number_of_iterations [log-level]`
* log-level is optional, but when specified is one of:
    * `-q`      quiet
    * `-v`      verbose
