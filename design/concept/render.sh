#!/bin/zsh
cd "${0:A:h}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for spec in "$@"; do
  name=${spec%%:*}; q=${spec#*:}; w=1600; h=900
  [[ $q == *"w="* ]] && w=$(echo $q | sed -E 's/.*w=([0-9]+).*/\1/') && h=$(echo $q | sed -E 's/.*h=([0-9]+).*/\1/')
  "$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=$w,$h --virtual-time-budget=20000 --screenshot=out/$name.png "http://localhost:8765/index.html?$q" >/dev/null 2>&1 && echo "ok $name"
done
