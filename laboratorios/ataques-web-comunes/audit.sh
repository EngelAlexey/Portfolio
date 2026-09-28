#!/usr/bin/env bash
export PATH=~/node24/bin:/usr/bin:/bin
d=$(mktemp -d); cd "$d"
echo "npm $(npm -v)"
npm init -y >/dev/null
npm i --ignore-scripts --no-audit express@4.17.1 >/dev/null 2>&1
echo '$ npm audit'
npm audit 2>&1 | tail -25
echo "exit=${PIPESTATUS[0]}"
echo '$ npm audit signatures'
npm audit signatures 2>&1 | tail -5
