# ipip_hexaco_ja

IPIP-HEXACO 240項目を、日本語で回答しやすい形にした静的Webアプリです。

## 特徴

- 240項目を1問ずつ表示
- 1〜5の回答基準を明示
- 直訳よりも設問の意図・ニュアンスが伝わることを優先した日本語訳
- 誤解しやすい項目には判断補足を表示
- 英語原文の表示切替
- 途中回答をJSONへ保存し、後日読み込んで再開
- 完了結果をJSON保存
- 過去結果JSONとの比較
- Cookie / localStorage / Analytics / API通信なし
- `connect-src 'none'` で回答データのネットワーク送信を禁止

## 使い方

このリポジトリをダウンロードまたはcloneし、`index.html` をブラウザで開いてください。

GitHub Pages等で公開して使うこともできますが、「アクセスしたこと自体をホスティング側にも残したくない」場合はローカルで開いてください。回答内容そのものはアプリから外部へ送信しません。

## 回答について

「状況による」というだけでは3を選ばず、普段どちら側に寄るかで答えます。

1と5も「絶対に例外がない」という意味ではありません。3は、条件を考慮しても本当に中間・五分五分の場合に使います。

## 出典

原項目:

- International Personality Item Pool (IPIP)
- Preliminary IPIP Scales Measuring Constructs Similar to Those Included in the HEXACO Personality Inventory
- https://ipip.ori.org/newhexaco_pi_key.htm

参考文献:

Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). The IPIP–HEXACO scales: An alternative, public-domain measure of the personality constructs in the HEXACO model. *Personality and Individual Differences, 42*, 1515–1526.

## 注意

この日本語訳は独自訳です。心理測定学的な標準化・妥当性検証を行った公式日本語版ではありません。

医療・臨床診断、採用選考その他の重大な判断には使用しないでください。
