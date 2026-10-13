#!/bin/bash
# 檢查 inferWardrobeMeta 推論出的 tag 是否在非測試程式碼中被消費
cd /Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src
for t in revealing utilitarian ornate streetwear outdoor_bias edgy_accessory elegant uniform romantic edgy casual futuristic heritage no_accessory accessory_small optional_silence; do
  hits=$(grep -rn -e "'$t'" -e "\"$t\"" . | grep -v '\.test\.' | grep -v "tags.push(" )
  n=$(printf "%s" "$hits" | grep -c . )
  echo "== $t consumers=$n"
  printf "%s\n" "$hits" | head -3 | cut -c1-170
done
