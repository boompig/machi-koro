# Decision List

* Roll 2 dice or 1 when player owns TRAIN_STATION
* Which (if any) card to buy
* Whether to re-roll dice if player owns RADIO_TOWER
* which player to steal from if player owns TV_STATION
* which player to steal from and which card to steal if player owns BUSINESS_COMPLEX

# Cards to implement

* BUSINESS_COMPLEX

# Animation Issues

* the +/- popups are per-card rather than per-turn

# AI

* after each game, the winning AI adds +1 to the weights of each card they used to win

# Further AI Ideas

* use a time-based approach
    - keep track of cards bought and time at which they were bought
    - on win, add +1 to card for each turn card was bought
    - layout of AI looks like:
        + {
            * "turn_(n - 1)": {
                - "FURNITURE_FACTORY": 2
            * },
            * "turn_(n)": {
                - "SHOPPING_MALL": 3
            * }
        + }
    - problems with this approach:
        + turns do not necessarily exactly correspond to game state from game to game
* use a points-based approach
    - keep track of cards bought and points at time when card was bought
    - on win, add +1 to card for each point at which card was bought
    - layout of AI looks like:
        + {
            * "(0)_points": {
                - "WHEAT": 2
            * },
            * "(1)_points": {
                - "FURNITURE_FACTORY": 3
            * }
        + }
    - issues with this approach:
        + ... extra data to keep track...
        + ???
