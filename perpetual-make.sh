#!/bin/bash

i=0
while [ 1 -eq 1 ]
do
    i=$(expr $i + 1)
    echo -n "$i. "
    make 2>&1
    sleep 5
done
