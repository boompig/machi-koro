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

* add a concept of waiting/saving
* keep track of money
    * have a way to serialize player state into a string
        * for now can be `($p_points_$c_coins)`
        * later can be bit array of cards, followed by number of coins
        * can try to use data from all players, not just current player
* use genetic algorithm ideas
    * remove non-determinism in decision-making, add mutation instead
