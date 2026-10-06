# ipip_hexaco_ja

IPIP-HEXACO 240項目を、日本語で回答しやすい形にした静的Webアプリです。

## 特徴

- 240項目を1問ずつ表示
- 1〜5の回答基準を明示
- 「状況による」というだけで3へ寄せない回答ガイド
- 240項目すべてを英語原文と突き合わせて翻訳レビュー済み
- 直訳よりも、原文の意図と日本語としての分かりやすさの両立を優先
- 誤解しやすい項目には判断補足を表示
- 英語原文の表示切替
- 途中回答をJSONへ保存し、後日読み込んで再開
- 完了JSONに6因子・24下位尺度・240問の質問文と回答を保存
- 複数時点のJSONを時系列で並列比較
  - 6因子
  - 24下位尺度
  - 240問それぞれの生回答
- 結果の文章要約をローカル生成
- ChatGPT等へ貼り付けるAI分析用プロンプトを生成
- Cookie / localStorage / Analytics / API通信なし
- `connect-src 'none'` で回答データのネットワーク送信を禁止

## 使い方

このリポジトリをダウンロードまたはcloneし、`index.html` をブラウザで開いてください。

GitHub Pages等で公開して使うこともできますが、「アクセスしたこと自体をホスティング側にも残したくない」場合はローカルで開いてください。回答内容そのものはアプリから外部へ送信しません。

### 長期比較

実施時に「記録名」と「実施日」を付けて結果JSONを保存しておくと、後から複数JSONをまとめて読み込んで、

- 3年前
- 2年前
- 1年前
- 今日

のように横並びで比較できます。

## 回答について

「状況による」というだけでは3を選ばず、普段どちら側に寄るかで答えます。

1と5も「絶対に例外がない」という意味ではありません。3は、条件を考慮しても本当に中間・五分五分の場合に使います。

## データ構造

質問データの正本は `data/items.json` です。

`items.generated.js` はブラウザから `file://` で直接開いて使えるようにするための生成物です。質問文や翻訳を修正するときは生成物を直接編集せず、

1. `data/items.json` を編集
2. `go run ./tools/generate_items.go`

の順で更新してください。

翻訳レビュー方針と主な修正内容は `docs/translation-review.md` にあります。

## JSON保存形式

完了JSONには以下を含めます。

- 実施日・任意の記録名
- 翻訳・出典情報
- 質問順と進捗情報
- IDごとの生回答
- 各質問の
  - 英語原文
  - 日本語訳
  - 判断補足
  - 1〜5の生回答
  - 逆転処理後の得点
- 6因子の得点
- 24下位尺度の得点

質問文そのものも保存するため、将来翻訳を修正した後でも「その時点でどの文面に答えたか」を確認できます。

## 出典

原項目:

- International Personality Item Pool (IPIP)
- Preliminary IPIP Scales Measuring Constructs Similar to Those Included in the HEXACO Personality Inventory
- https://ipip.ori.org/newhexaco_pi_key.htm
- https://ipip.ori.org/newPermission.htm

参考文献:

Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). The IPIP-HEXACO scales: An alternative, public-domain measure of the personality constructs in the HEXACO model. *Personality and Individual Differences, 42*, 1515-1526.

IPIP公式は、IPIPの項目・尺度・inventoryをpublic domainとしており、コピー・編集・翻訳・商用/非商用利用に許可申請は不要としています。

## ライセンス

- アプリケーションコード、独自日本語訳、補足説明、文書: MIT License
- 英語IPIP原項目・尺度: IPIP上流のpublic domain material

詳細は `LICENSE` と `NOTICE.md` を参照してください。

## 注意

この日本語訳は独自訳です。240項目すべて英語原文と照合してレビューしていますが、心理測定学的な標準化・妥当性検証を行った公式日本語版ではありません。

医療・臨床診断、採用選考その他の重大な判断には使用しないでください。
