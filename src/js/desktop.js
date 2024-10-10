(function (PLUGIN_ID) {

  const chatHistory = [];
  let searchResult = [];

  // サジェストボタンを作成する関数
  function createSuggestButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '5px 10px';
    button.style.border = '1px solid #007bff';
    button.style.borderRadius = '5px';
    button.style.backgroundColor = '#fff';
    button.style.color = '#007bff';
    button.style.cursor = 'pointer';

    // ボタンクリック時に入力ボックスにテキストをセットするイベントリスナー
    button.addEventListener('click', () => {
      chatInput.value = text;
    });

    document.getElementById("container").appendChild(button)
  }

  // ポップアップチャットUIを生成する関数
  function createChatPopup() {
    // ポップアップチャットコンテナを作成
    const chatContainer = document.createElement('div');
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '20px';
    chatContainer.style.right = '20px';
    chatContainer.style.width = '700px';
    chatContainer.style.padding = '20px';
    chatContainer.style.backgroundColor = 'white';
    chatContainer.style.borderRadius = '5px';
    chatContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    chatContainer.style.zIndex = '1000';

    // 閉じるボタンを作成
    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '18px';
    chatContainer.appendChild(closeButton);

    // チャット出力エリアを作成
    const chatOutput = document.createElement('div');
    chatOutput.style.height = '500px';
    chatOutput.style.overflowY = 'scroll';
    chatOutput.style.marginBottom = '10px';
    chatOutput.style.border = '1px solid #eee';
    chatOutput.style.padding = '10px';
    chatOutput.style.borderRadius = '5px';
    chatOutput.style.backgroundColor = '#f9f9f9';
    chatContainer.appendChild(chatOutput);

    // 入力ボックスを作成
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.id = 'ai_input'
    chatInput.placeholder = 'Type your message...';
    chatInput.style.width = 'calc(100% - 80px)';  // 入力ボックスの幅を調整
    chatInput.style.padding = '10px';
    chatInput.style.borderRadius = '5px';
    chatInput.style.border = '1px solid #ccc';
    chatContainer.appendChild(chatInput);

    // 送信ボタンを作成
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.padding = '10px';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '5px';
    sendButton.style.backgroundColor = '#007bff';
    sendButton.style.color = 'white';
    sendButton.style.cursor = 'pointer';
    chatContainer.appendChild(sendButton);

    // チャットコンテナをページに追加
    document.body.appendChild(chatContainer);

    // サジェストボタンを表示するコンテナを作成
    const suggestContainer = document.createElement('div');
    suggestContainer.style.display = 'flex';
    suggestContainer.id = 'container'
    suggestContainer.style.gap = '10px';  // ボタン間のスペース
    suggestContainer.style.marginBottom = '10px';  // コンテナの下にスペース
    chatContainer.appendChild(suggestContainer);

    // サジェストボタンを追加
    // createSuggestButton('こんにちは');


    // 閉じるボタンのクリックイベントを設定
    closeButton.addEventListener('click', function () {
      document.body.removeChild(chatContainer);
    });

    // 送信ボタンのクリックイベントを設定
    sendButton.addEventListener('click', function () {
      const message = chatInput.value.trim();
      if (message !== '') {
        displayMessage(chatOutput, message, 'user', false);
        chatInput.value = '';
        sendToAI(message, chatOutput);
      }
    });
  }

  // チャット出力エリアにメッセージを表示
  function displayMessage(container, message, senderType, isMarkdown = false) {
    const messageElement = document.createElement('div');

    if (senderType === 'AI') {
      messageElement.style.color = '#ffffff';  // AIメッセージのフォントカラー
      messageElement.style.backgroundColor = '#005b9f';  // ダークブルー系の背景色に変更
    } else if (senderType === 'user') {
      messageElement.style.color = '#000000';  // ユーザーメッセージのフォントカラー
      messageElement.style.backgroundColor = '#f1f1f1';  // ユーザーメッセージの背景色
    }

    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.marginBottom = '10px';

    if (isMarkdown) {
      messageElement.innerHTML = `<strong>${senderType === 'AI' ? 'AI' : 'You'}:</strong> ` + marked.parse(message);
    } else {
      messageElement.textContent = `${senderType === 'AI' ? 'AI' : 'You'}: ` + message;
    }

    container.appendChild(messageElement);
  }

  // AIにメッセージを送信して応答を取得
  async function sendToAI(message, chatOutput) {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    console.log(config)
    console.log(message)
    chatHistory.push({ role: 'user', content: message });
    console.log(chatHistory)
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: "system",
              content: `あなたはkintoneの専門的なサポートAIです。ユーザーの入力言語を検出し、その言語で応答を生成します。

              """

              * ユーザーの入力がkintoneに関する質問、依頼、課題、またはkintoneの情報提供を求めている内容である場合は、必ず'searchRag'関数を使用して関連する情報を検索してください。
                kintoneに関連する質問の場合、searchRagを通さずに返答をすることは誤情報の提供につながるため禁止とします。
                質問の明確さに関係なく、kintoneの使用方法や解決策を求める全ての問い合わせをカバーするように努めてください。

              * kintoneに関係のない質問、例えば「挨拶」「LLMのリバースエンジニアリング」「kintone以外のサービスの質問」などについてはshouldSearchをfalseで返却してください。

              """


              `
            },
            ...chatHistory
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "searchRag",
                description: "Performs a search based on a user query. This function should be used for queries related to kintone plugins or configuration methods, or when the user's question includes phrases like 'ありますか？' or 'どうすればいいですか？'.",
                strict: true,
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: ["string", "null"],
                      description: "The search keyword or phrase to use for the query."
                    },
                    shouldSearch:{
                      type: "boolean",
                      description: "Returns whether a RAG search is required in response to a user query."
                    }
                  },
                  required: ["query", "shouldSearch"],
                  additionalProperties: false
                }
              }
            },
          ],
          tool_choice: "required"
        })
      });
      let searchResult = ""

      if(res) {
        const resData = await res.json();
        const resToolCalls = resData.choices[0].message.tool_calls;
        if (resToolCalls && resToolCalls.length > 0) {
          const _args = JSON.parse(resToolCalls[0].function.arguments);
          if(_args.shouldSearch && _args.query) {
            searchResult = await searchRag(_args.query);
            chatHistory.push({
              role: "assistant",
              content: null,
              tool_calls: resToolCalls
            });
            chatHistory.push({
              role: "tool",
              content: JSON.stringify(searchResult),
              tool_call_id: resToolCalls[0].id,
              name: resToolCalls[0].function.name
            });
            displayMessage(chatOutput, "検索結果を取得しました", "AI", false);

          }
        }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: "system",
              content: `あなたはkintoneの専門的なサポートAIです。ユーザーの入力言語を検出し、その言語で応答を生成します。

              """

              ユーザーの入力がkintoneに関する質問、依頼、課題、またはkintoneの情報提供を求めている内容である場合は、必ず'searchRag'関数を使用して関連する情報を検索してください。
              質問の明確さに関係なく、kintoneの使用方法や解決策を求める全ての問い合わせをカバーするように努めてください。

              """

              ユーザーの指示が以下に該当する場合は、kintone APIを呼び出して関連する情報を収集してください。
              - 操作がアプリの設定の参照・変更を含む場合
              - 権限の設定が必要な場合
              kintone APIを呼び出すために指定する info_types とAPIのパスの一覧は以下のとおりです。
              フィールド情報は、どのタスクでも必要になりますので、他のAPIと一緒に呼び出してください。
              - "fields": /k/v1/app/form/fields.json
              - "views": /k/v1/app/views.json
              - "process": /k/v1/app/status.json
              - "layout": /k/v1/app/form/layout.json
              - "graph": /k/v1/app/reports.json
              - "general": /k/v1/app/settings.json
              - "plugin": /k/v1/app/plugins.json
              - "generalNotification": /k/v1/app/notifications/general.json
              - "perRecordNotification": /k/v1/app/notifications/perRecord.json
              - "reminderNotification": /k/v1/app/notifications/reminder.json
              - "appPermissions": /k/v1/app/acl.json
              - "recordPermissions": /k/v1/record/acl.json
              - "fieldPermissions": /k/v1/field/acl.json
              - "action": /k/v1/app/actions.json
              - "adminNotes": /k/v1/app/adminNotes.json
              - "app": /k/v1/app.json
              - "record": /k/v1/record.json
              - "records": /k/v1/records.json
              ユーザーの要求を実現するために必要な操作をステップに分けて明確に説明してください。

              """
              ユーザーからの入力が質問形式でない場合や具体的な要望が含まれない場合でも、kintoneに関連する可能性がある場合は'searchRag'関数を発動させ、情報提供を行ってください。

              ユーザーからの入力に応じて複数のfunction callingが実行される場合もあります。
              `
            },
            ...chatHistory
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "getkintoneAppInfo",
                description: "Retrieve specified types of information from a kintone app.",
                strict: true,
                parameters: {
                  type: "object",
                  properties: {
                    info_types: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [
                          "fields",
                          "views",
                          "process",
                          "layout",
                          "graph",
                          "general",
                          "plugin",
                          "generalNotification",
                          "perRecordNotification",
                          "reminderNotification",
                          "appPermissions",
                          "recordPermissions",
                          "fieldPermissions",
                          "action",
                          "adminNotes",
                          "app",
                          "record",
                          "records",
                        ],
                        description: `Specify the types of information to retrieve:
                        - 'fields': Gets the list of fields and field settings of an App.
                        - 'views': Gets the View settings of an App.
                        - 'process': Gets the process management settings of an App.
                        - 'layout': Gets the field layout info of a form in an App.
                        - 'graph': Gets the Graph settings of the App.
                        - 'general': Gets the description, name, icon, revision and color theme of an App.
                        - 'plugin': Gets the list of Plug-ins added to an App.
                        - 'generalNotification': Gets the General Notification settings of the App.
                        - 'perRecordNotification': Gets the Per Record Notification settings of the App.
                        - 'reminderNotification': Gets the Reminder Notification settings of the App.
                        - 'appPermissions': Gets the App permissions of an App.
                        - 'recordPermissions': Gets the Record permission settings of an App.
                        - 'fieldPermissions': Gets the Field permission settings of an App.
                        - 'action': Gets the Action Settings of the App.
                        - 'adminNotes': Gets notes for app administrators and their settings.
                        - 'app': Gets general information of an App, including the name, description, related Space, creator and updater information.
                        - 'record': Retrieves details of 1 record from an App by specifying the App ID and Record ID.
                        - 'records': Retrieves details of multiple records from an App by specifying the App ID and a query string.`
                      },
                      description: `Types of information to retrieve from the kintone app.
                      To retrieve the list view settings, 'views' must be specified.`
                    },
                    appId: {
                      type: "number",
                      description: `The id of kintone app. Default value is ${kintone.app.getId()}`,
                    },
                    query: {
                      type: ["string", "null"],
                      description: `アプリからレコードを取得するためのクエリ文字列です。これは 'records' info_type と併せて使用されます。
                        フィールドタイプに応じてクエリを生成する必要があります。以下のルールに特に注意してください：
                        1. 'ドロップダウン'フィールドの場合、'=' の代わりに 'in' 演算子を使用します。例：'ドロップダウン_0 in ("A", "B")'
                        2. '複数選択'フィールドの場合も 'in' 演算子を使用します。例：'複数選択_0 in ("オプション1", "オプション2")'
                        3. 'チェックボックス'フィールドの場合も 'in' 演算子を使用します。例：'チェックボックス_0 in ("チェック1", "チェック2")'
                        4. 'ラジオボタン'フィールドの場合、'in' 演算子を使用します。例：'ラジオボタン_0 in ("ラジオ1")'
                        5. '文字列（1行）'や'文字列（複数行）'などのテキストベースのフィールドの場合、部分一致には 'like' 演算子を使用します。例：'文字列_0 like "テスト"'
                        6. 数値フィールドの場合、'=', '>', '<', '>=', '<=' などの適切な演算子を使用します。例：'数値_0 > 10'
                        7. 日付フィールドの場合、適切な場合は日付関数を使用します。例：'日付_0 = TODAY()'

                        異なるフィールドタイプに対する演算子の互換性の問題を避けるため、これらのルールに従ってクエリを生成してください。

                        ### クエリの書き方

                        条件を絞り込むクエリで利用できる演算子／関数／オプションです。
                        演算子／関数／オプションは組み合わせて使用できます。

                        「フィールドコード 演算子 値」のように記述します。

                        #### 演算子

                        * 演算子: =
                          * 例: 文字列_0 = "テスト"
                          * 説明: 演算子の前に指定したフィールドコードの値と演算子の後に指定した値が一致する
                        * 演算子: !=
                          * 例: 文字列_0 != "テスト"
                          * 説明: 演算子の前に指定したフィールドコードの値と演算子の後に指定した値が異なる
                        * 演算子: >
                          * 例: 数値_0 > 10
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値より大きい
                        * 演算子: <
                          * 例: 数値_0 < 10
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値より小さい
                        * 演算子: >=
                          * 例: 数値_0 >= 10
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値以上である
                        * 演算子: <=
                          * 例: 数値_0 <= 10
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定された値以下である
                        * 演算子: in
                          * 例: ドロップダウン_0 in ("A", "B")
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後の括弧内に列挙した文字列のいずれかと一致する
                        * 演算子: not in
                          * 例: ドロップダウン_0 not in ("A", "B")
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後の括弧内に列挙した文字列と一致しない
                        * 演算子: like
                          * 例: 文字列_0 like "テスト"
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値を含む判定するフィールドの型が添付ファイルの場合、ファイル名とファイルの内容が判定の対象になります。like演算子で使用できない記号は、次のページを参照してください。        検索キーワード入力時の注意事項
                        * 演算子: not like
                          * 例: 文字列_0 not like "テスト"
                          * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値を含まないlike演算子で使用できない記号は、次のページを参照してください。        検索キーワード入力時の注意事項
                        * 演算子: or
                          * 例: 数値_0 < 10 or 数値_0 > 20
                          * 説明: 上述の演算子を使用した2つの条件式の論理和
                        * 演算子: and
                          * 例: 数値_0 >= 10 and 数値_0 <= 20
                          * 説明: 上述の演算子を使用した2つの条件式の論理積

                        ##### 補足

                        *   テーブル内のフィールド、および関連レコードのフィールドをクエリに含める場合、"="や"!="演算子の代わりに、"in"や"not in"演算子を使ってください。
                        *   クエリで文字列検索する場合は単語検索です。

                        #### 関数

                        * 関数名: LOGINUSER()
                          * 例: 作成者 in (LOGINUSER())
                          * 説明: APIを実行したユーザー
                        * 関数名: PRIMARY_ORGANIZATION()
                          * 例: 組織 in (PRIMARY_ORGANIZATION())
                          * 説明: APIを実行したユーザーの優先する組織APIを実行したユーザーに優先する組織が設定されていない場合、組織 in (PRIMARY_ORGANIZATION())の条件は無視され、それ以外の絞り込み条件を満たすすべてのレコードが取得されます。
                        * 関数名: NOW()
                          * 例: 作成日時 = NOW()
                          * 説明: APIを実行した日時
                        * 関数名: TODAY()
                          * 例: 作成日時 = TODAY()
                          * 説明: APIを実行した日
                        * 関数名: YESTERDAY()
                          * 例: 作成日時 = YESTERDAY()
                          * 説明: APIを実行した日の前日
                        * 関数名: TOMORROW()
                          * 例: 日時 = TOMORROW()
                          * 説明: APIを実行した日の翌日
                        * 関数名: FROM_TODAY(数字, 期間の単位)
                          * 例: 作成日時 < FROM_TODAY(5, DAYS)
                          * 説明: APIを実行した日から起算した期間期間の単位に指定可能な文字列は次のとおりです。DAYS：日単位WEEKS：週単位MONTHS：月単位YEARS：年単位
                        * 関数名: THIS_WEEK(曜日)
                          * 例: 作成日時 = THIS_WEEK()
                          * 説明: APIを実行した週引数に次の値を指定することで、曜日を指定できます。SUNDAY：日曜日MONDAY：月曜日TUESDAY：火曜日WEDNESDAY：水曜日THURSDAY：木曜日FRIDAY：金曜日SATURDAY：土曜日引数を指定しない場合は、今週のすべての日が対象です。
                        * 関数名: LAST_WEEK(曜日)
                          * 例: 作成日時 = LAST_WEEK()
                          * 説明: APIを実行した週の前週引数にTHIS_WEEK()と同じ値を指定することで、曜日を指定できます。引数を指定しない場合は、前週のすべての日が対象です。
                        * 関数名: NEXT_WEEK(曜日)
                          * 例: 日時 = NEXT_WEEK()
                          * 説明: APIを実行した週の翌週引数にTHIS_WEEK()と同じ値を指定することで、曜日を指定できます。引数を指定しない場合は、翌週のすべての日が対象です。
                        * 関数名: THIS_MONTH(数値またはフォーマット文字)
                          * 例: 作成日時 = THIS_MONTH()
                          * 説明: APIを実行した月引数に次の値を指定することで、日付を指定できます。LAST：月末1から31の数値：日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌月1日で計算されます。
                        * 関数名: LAST_MONTH(数値またはフォーマット文字)
                          * 例: 作成日時 = LAST_MONTH()
                          * 説明: APIを実行した月の前月引数に次の値を指定することで、日付を指定できます。LAST：前月末1から31の数値：前月の日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌月1日で計算されます。
                        * 関数名: NEXT_MONTH(数値またはフォーマット文字)
                          * 例: 作成日時 = NEXT_MONTH()
                          * 説明: APIを実行した月の翌月引数に次の値を指定することで、日付を指定できます。LAST：翌月末1から31の数値：翌月の日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌々月1日で計算されます。
                        * 関数名: THIS_YEAR()
                          * 例: 作成日時 = THIS_YEAR()
                          * 説明: APIを実行した年
                        * 関数名: LAST_YEAR()
                          * 例: 作成日時 = LAST_YEAR()
                          * 説明: APIを実行した年の前年
                        * 関数名: NEXT_YEAR()
                          * 例: 日時 = NEXT_YEAR()
                          * 説明: APIを実行した年の翌年

                        #### オプション

                        * オプション: order by
                          * 例: order by 更新日時asc
                          * 説明: レコードを取得する順番本オプションに続けて指定したフィールドコードの値で並び替えられます。フィールドコードの後にascを指定すると昇順、descを指定すると降順で並び替えられます。複数の項目で並び替える場合、「フィールドコード 並び順」をカンマ区切りで指定します。例：order by フィールドコード1 desc, フィールドコード2 asc省略すると、レコードIDの降順で並び替えされます。order byで指定できるフィールドには制限があります。詳細は次のページを参照してください。        ソートで選択できるフィールド
                        * オプション: limit
                          * 例: limit 20
                          * 説明: 取得するレコード数たとえばlimit 20を指定すると、レコード先頭から20件のレコードを取得します。0から500までの数値を指定できます。省略すると、100が設定されます。
                        * オプション: offset
                          * 例: offset 30
                          * 説明: 取得をスキップするレコード数たとえばoffset 30を指定すると、レコード先頭から30番目までのレコードは取得せず、31番目のレコードから取得します。0から10,000までの数値を指定できます。省略すると、0が設定されます。

                        #### フィールド、システム識別子ごとの利用可能な演算子と関数一覧

                        * フィールドまたはシステム識別子: レコード番号
                          * = != > < >= <= innot in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: $id
                          * = != > < >= <= in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 作成者
                          * in not in
                          * 利用可能な関数: LOGINUSER()
                        * フィールドまたはシステム識別子: 作成日時
                          * = != > < >= <=
                          * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                        * フィールドまたはシステム識別子: 更新者
                          * in not in
                          * 利用可能な関数: LOGINUSER()
                        * フィールドまたはシステム識別子: 更新日時
                          * = != > < >= <=
                          * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                        * フィールドまたはシステム識別子: 文字列（1行）
                          * = != in not in like not like
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: リンク
                          * = != in not in like not like
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 数値
                          * = != > < >= <= in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 計算
                          * = != > < >= <= in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 文字列（複数行）
                          * like not like
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: リッチエディター
                          * like not like
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: チェックボックス
                          * in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: ラジオボタン
                          * in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: ドロップダウン
                          * in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 複数選択
                          * in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 添付ファイル
                          * like not like
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 日付
                          * = != > < >= <=
                          * 利用可能な関数: TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                        * フィールドまたはシステム識別子: 時刻
                          * = != > < >= <=
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: 日時
                          * = != > < >= <=
                          * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                        * フィールドまたはシステム識別子: ユーザー選択
                          * in not in
                          * 利用可能な関数: LOGINUSER()
                        * フィールドまたはシステム識別子: 組織選択
                          * in not in
                          * 利用可能な関数: PRIMARY_ORGANIZATION()
                        * フィールドまたはシステム識別子: グループ選択
                          * in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: ステータス
                          * = != in not in
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: ルックアップ
                          * ルックアップ元のフィールドタイプと同じ
                          * 利用可能な関数: ルックアップ元のフィールドタイプと同じ
                        * フィールドまたはシステム識別子: 関連レコード
                          * 参照するアプリのフィールドタイプと同じ
                          * 利用可能な関数: 参照するアプリのフィールドタイプと同じ
                        * フィールドまたはシステム識別子: グループ
                          * なし
                          * 利用可能な関数: なし
                        * フィールドまたはシステム識別子: カテゴリー
                          * なし
                          * 利用可能な関数: なし

                        #### エスケープ処理

                        次のフィールドの値に、'"'（ダブルクオート）やバックスラッシュ'\'（バックスラッシュ）を含む場合、エスケープが必要です。

                        *   文字列（1行）
                        *   文字列（複数行）
                        *   リッチエディター
                        *   チェックボックス
                        *   ラジオボタン
                        *   ドロップダウン
                        *   複数選択
                        *   ステータス

                        クエリ文字列はこちらです: ${message}
                        フィールド情報はこちらです: ${JSON.stringify((await getFieldInformation(kintone.app.getId())).data.fields)}
                      `
                    },
                    recordId: {
                      type: ["string", "null"],
                      description: `The record ID of the record to retrieve.`
                    }
                  },
                  required: ["info_types", "appId", "query", "recordId"],
                  additionalProperties: false
                }
              }
            },
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('data: ', data);

      // if (data.choices[0].message.content) {
      //   displayMessage(chatOutput, data.choices[0].message.content, "AI", true);
      // }
      console.log(chatHistory);

      const toolCalls = data.choices[0].message.tool_calls;
      // toolCallsがなければ通常の会話を履歴にためる
      // if (!toolCalls) {
      //   chatHistory.push({ role: 'assistant', content: data.choices[0].message.content });
      // }

      if (toolCalls && toolCalls.length > 0) {
        // toolCallsをassistantが呼び出した履歴
        chatHistory.push({
          ...data.choices[0].message,
          content: null
        });
        for (const toolCall of toolCalls) {
          const results = [];
          const functionName = toolCall.function.name; // 呼び出す関数の名前を取得
          const args = JSON.parse(toolCall.function.arguments);
          const { query, recordId } = args; // searchRag用の検索クエリを取得
          console.log('=>>>>>>>>>>>>>>>>>>', args);

          results.push(await getFieldInformation(kintone.app.getId()));
          displayMessage(chatOutput, "フィールド情報が正常に取得されました。", "AI", false);

          if (functionName === "getkintoneAppInfo") {
            const infoTypes = args.info_types;
            const appId = args.appId || kintone.app.getId();

            for (const infoType of infoTypes) {
              switch (infoType) {
                case "fields":
                  if(appId == kintone.app.getId()) break;
                  results.push(await getFieldInformation(appId));
                  displayMessage(chatOutput, "フィールド情報が正常に取得されました。", "AI", false);
                  break;
                case "views":
                  results.push(await getViewInformation(appId));
                  displayMessage(chatOutput, "ビュー情報が正常に取得されました。", "AI", false);
                  break;
                case "process":
                  results.push(await getProcessManagementSettings(appId));
                  displayMessage(chatOutput, "プロセス管理情報が正常に取得されました。", "AI", false);
                  break;
                case "layout":
                  results.push(await getFormLayout(appId));
                  displayMessage(chatOutput, "フォームのレイアウト情報が正常に取得されました。", "AI", false);
                  break;
                case "graph":
                  results.push(await getGraphSettings(appId));
                  displayMessage(chatOutput, "アプリのグラフの設定が正常に取得されました。", "AI", false);
                  break;
                case "general":
                  results.push(await getGeneralSettings(appId));
                  displayMessage(chatOutput, "アプリの一般設定が正常に取得されました。", "AI", false);
                  break;
                case "plugin":
                  results.push(await getAppPlugins(appId));
                  displayMessage(chatOutput, "アプリに追加されているプラグインが正常に取得されました。", "AI", false);
                  break;
                case "generalNotification":
                  results.push(await getGeneralNotificationSettings(appId));
                  displayMessage(chatOutput, "アプリの条件通知の設定が正常に取得されました。", "AI", false);
                  break;
                case "perRecordNotification":
                  results.push(await getPerRecordNotificationSettings(appId));
                  displayMessage(chatOutput, "レコードの条件通知の設定が正常に取得されました。", "AI", false);
                  break;
                case "reminderNotification":
                  results.push(await getReminderNotificationSettings(appId));
                  displayMessage(chatOutput, "リマインダーの条件通知の設定が正常に取得されました。", "AI", false);
                  break;
                case "appPermissions":
                  results.push(await getAppPermissions(appId));
                  displayMessage(chatOutput, "アプリのアクセス権の設定が正常に取得されました。", "AI", false);
                  break;
                case "recordPermissions":
                  results.push(await getRecordPermissions(appId));
                  displayMessage(chatOutput, "レコードのアクセス権の設定が正常に取得されました。", "AI", false);
                  break;
                case "fieldPermissions":
                  results.push(await getFieldPermissions(appId));
                  displayMessage(chatOutput, "フィールドのアクセス権の設定が正常に取得されました。", "AI", false);
                  break;
                case "action":
                  results.push(await getActionSettings(appId));
                  displayMessage(chatOutput, "アプリのアクション設定が正常に取得されました。", "AI", false);
                  break;
                case "adminNotes":
                  results.push(await getAppAdminNotes(appId));
                  displayMessage(chatOutput, "アプリの管理者用メモが正常に取得されました。", "AI", false);
                  break;
                case "app":
                  results.push(await getApp(appId));
                  displayMessage(chatOutput, "1件のアプリの情報が正常に取得されました。", "AI", false);
                  break;
                case "record":
                  results.push(await getRecord(appId, recordId));
                  displayMessage(chatOutput, "1件のレコードが正常に取得されました。", "AI", false);
                  break;
                case "records":
                  results.push(await getRecords(appId, query));
                  displayMessage(chatOutput, "複数のレコードが正常に取得されました。", "AI", false);
                  break;
                default:
                  console.error('Unknown info type:', infoType);
              }
            }
          }
          console.log("result: ", results);

          // toolCallsで呼び出した関数の結果をchatHistoryに保存
          chatHistory.push({
            role: "tool",
            content: JSON.stringify(results),
            tool_call_id: toolCall.id,
            name: toolCall.function.name
          });
        }
      }

      // Send the results back to OpenAI
      console.log(JSON.stringify((await getViewInformation(kintone.app.getId())).data.views));
      const completion_payload = {
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: `
              #アシスタントの概要
              あなたはkintoneアプリに関する情報を提供する役立つアシスタントです。アプリIDは${kintone.app.getId()}です。
              ユーザーが実行したい特定のタスクや探したいソリューションやプラグイン、設定方法についてkintoneでの操作をガイドおよび解決方法を案内します。
              操作方法と検索結果のいずれかや両方が含まれる可能性があります。

              返答では以下の優先度を意識して返答を作成してください。
              1. 最初にkintoneの基本機能で実現か可能か
              2. 次にエコシステムが提供しているkintoneプラグインを導入すれば解決が可能か
              3. 基本機能にもプラグインにも見つからずJavaScriptなどのカスタマイズ開発が必要か
              カスタマイズ開発が必要な場合は、他の機能でJavaScriptカスタマイズ開発専用のプラグイン「Associate AIHub for kintone」を提供しているのでユーザーに推薦をお願いします。

              ##kintone操作に関連する場合
              各ステップで実行される操作について詳しく説明し、ユーザーが全体の流れを明確に理解できるようにします。
              また、ユーザーの入力言語を検出し、その言語で応答を提供することで、ユーザーにとってより親しみやすいコミュニケーションを実現します。
              フィールドの追加やレコードの更新など、どのような操作が行われるのかを丁寧に説明してください。

              kintoneアプリの一覧画面を操作する際、以下の項目が必須となります：

              1. **app**: 数値 - アプリIDを指定します。必須です。
              2. **views**: オブジェクト - 一覧の設定の一覧を指定します。必須です。指定しないと既存の一覧は削除されます。
                  - **views.一覧名**: オブジェクト - 各一覧の設定を指定します。追加、更新、削除の操作に対応します。
                  - **views.一覧名.index**: 文字列 - 一覧の表示順を指定します。必須です。
                  - **views.一覧名.type**: 文字列 - 一覧の表示形式を指定します。必須です。以下の形式から選択します:
                      - LIST: 表形式
                      - CALENDAR: カレンダー形式
                      - CUSTOM: カスタマイズ形式

              1. 取得した情報の要約:
              - フィールド情報: {取得したフィールド情報の要約}
              - ビュー情報: {取得したビュー情報の要約}
              - プロセス管理情報: {取得したプロセス管理情報の要約}
              - その他の情報: {その他取得した情報の要約}

              2. Operationの要約:
              - 実行されるAPI: {api}
              - 実行されるメソッド: {method}
              - リクエストボディの内容: {bodyの要約}

              上記の内容を元に、適切なkintone操作を行います。

              ##kintone操作以外のプラグイン情報の検索など
              searchRagより取得した検索結果によって、ユーザーから入力した内容に近いと思われるデータを出力しています。
              それぞれのリンクへの案内は以下の情報を受け取ってJavaScript上で表示処理を行います。
              検索結果の要約を返却するようにしてください。

              - source: 検索先のURL
              - title: 検索先ページのタイトル(検索先がHTMLに限る)
              - description: 検索先ページのheadに含まれる説明(検索先がHTMLに限る)
              - page: 検索先PDFのページ番号
              - provider: 情報の提供元を以下の３種類で表示しています
                - firstparty: kintone公式が案内している情報元
                - secondparty: サービス提供会社(showcase-tv)が提供している情報元
                - thirdparty: 第３者のサイトを参照した情報元
              - pageType: ページのカテゴリー情報(以下は一部抜粋)
                - search_by_service_name: プラグインの情報
            `
          },
          ...chatHistory
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "assistant_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                response_type: {
                  type: "string",
                  enum: ["standard_reply", "kintone_operation"],
                  description: "Specifies the type of response: 'standard_reply' for general messages, or 'kintone_operation' for API operation instructions."
                },
                message: {
                  type: "string",
                  description: "This message provides a detailed summary of the retrieved field information and view settings, outlines the necessary steps for the user to take, and mentions that the operation can also be executed directly by pressing a button. The information should include specific field names and their attributes, as well as any updates to the view settings.",
                  example: "フィールド情報が取得されました。このアプリには以下のフィールドが存在します:\n- 'ユーザー選択' (ユーザー選択フィールド)\n- 'ステータス' (ステータスフィールド)\n- '更新者' (更新者フィールド)\n\n次に、一覧に'更新者'フィールドを追加します。\n1. 'ビュー設定'で現在の一覧を確認します。\n2. 一覧に'更新者'フィールドを追加します。\n3. 設定を保存します。\n\nボタンを押すことで、これらの手順をスキップして、直接操作を実行することも可能です。"
                },
                operation: {
                  type: ["object", "null"],
                  description: "Contains details about the API operation to be performed, including the API endpoint, method, and request body. This can be null if no operation is required.",
                  properties: {
                    api: {
                      type: "string",
                      enum: [
                        "/k/v1/preview/app/views.json",
                        "/k/v1/preview/app/form/fields.json",
                        "/k/v1/preview/app/status.json"
                      ],
                      description: "The kintone API endpoint to be called."
                    },
                    method: {
                      type: "string",
                      enum: ["GET", "PUT", "POST"],
                      description: "The HTTP method to be used for the API call."
                    },
                    body: {
                      anyOf: [
                        {
                          type: "object",
                          properties: {
                            views: {
                              type: "array",
                              description: `kintone app views list. Have to add past views to the list. Current view lists are here: ${JSON.stringify((await getViewInformation(kintone.app.getId())).data.views)}`,
                              items: {
                                type: "object",
                                description: "kintone list app body properties",
                                properties: {
                                  index: {
                                    type: "string"
                                  },
                                  type: {
                                    type: "string",
                                    enum: ["LIST", "CALENDAR", "CUSTOM"]
                                  },
                                  name: {
                                    type: ["string", "null"],
                                    description: "app list name"
                                  },
                                  fields: {
                                    type: "array",
                                    items: {
                                      type: "string",
                                    },
                                    description: "List of field codes for fields to display. Specify the field code for each field to display."
                                  },
                                  date: {
                                    type: "string",
                                  },
                                  title: {
                                    type: "string",
                                    description: "Optional. Specify this if the field code of the field to be used as the title is \"CALENDAR\". If omitted, the record number field will be set.",
                                  },
                                  html: {
                                    type: "string",
                                    description: "HTML content to be used for customization. Specify this when the HTML content to be used for customization is \"CUSTOM\"."
                                  },
                                  pager: {
                                    type: "boolean",
                                  },
                                  device: {
                                    type: "string",
                                    enum: ["DESKTOP", "ANY"],
                                  },
                                  filterCond: {
                                    type: "string",
                                    description: `条件を絞り込むクエリで利用できる演算子／関数／オプションです。
                                      演算子／関数／オプションは組み合わせて使用できます。

                                      「フィールドコード 演算子 値」のように記述します。

                                      * 演算子: =
                                        * 例: 文字列_0 = "テスト"
                                        * 説明: 演算子の前に指定したフィールドコードの値と演算子の後に指定した値が一致する
                                      * 演算子: !=
                                        * 例: 文字列_0 != "テスト"
                                        * 説明: 演算子の前に指定したフィールドコードの値と演算子の後に指定した値が異なる
                                      * 演算子: >
                                        * 例: 数値_0 > 10
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値より大きい
                                      * 演算子: <
                                        * 例: 数値_0 < 10
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値より小さい
                                      * 演算子: >=
                                        * 例: 数値_0 >= 10
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値以上である
                                      * 演算子: <=
                                        * 例: 数値_0 <= 10
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定された値以下である
                                      * 演算子: in
                                        * 例: ドロップダウン_0 in ("A", "B")
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後の括弧内に列挙した文字列のいずれかと一致する
                                      * 演算子: not in
                                        * 例: ドロップダウン_0 not in ("A", "B")
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後の括弧内に列挙した文字列と一致しない
                                      * 演算子: like
                                        * 例: 文字列_0 like "テスト"
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値を含む判定するフィールドの型が添付ファイルの場合、ファイル名とファイルの内容が判定の対象になります。like演算子で使用できない記号は、次のページを参照してください。        検索キーワード入力時の注意事項
                                      * 演算子: not like
                                        * 例: 文字列_0 not like "テスト"
                                        * 説明: 演算子の前に指定したフィールドコードの値が、演算子の後に指定した値を含まないlike演算子で使用できない記号は、次のページを参照してください。        検索キーワード入力時の注意事項
                                      * 演算子: or
                                        * 例: 数値_0 < 10 or 数値_0 > 20
                                        * 説明: 上述の演算子を使用した2つの条件式の論理和
                                      * 演算子: and
                                        * 例: 数値_0 >= 10 and 数値_0 <= 20
                                        * 説明: 上述の演算子を使用した2つの条件式の論理積

                                      ##### 補足

                                      *   テーブル内のフィールド、および関連レコードのフィールドをクエリに含める場合、"="や"!="演算子の代わりに、"in"や"not in"演算子を使ってください。
                                      *   クエリで文字列検索する場合は単語検索です。
                                          詳細は次のページを参照してください。

                                      * 関数名: LOGINUSER()
                                        * 例: 作成者 in (LOGINUSER())
                                        * 説明: APIを実行したユーザー
                                      * 関数名: PRIMARY_ORGANIZATION()
                                        * 例: 組織 in (PRIMARY_ORGANIZATION())
                                        * 説明: APIを実行したユーザーの優先する組織APIを実行したユーザーに優先する組織が設定されていない場合、組織 in (PRIMARY_ORGANIZATION())の条件は無視され、それ以外の絞り込み条件を満たすすべてのレコードが取得されます。
                                      * 関数名: NOW()
                                        * 例: 作成日時 = NOW()
                                        * 説明: APIを実行した日時
                                      * 関数名: TODAY()
                                        * 例: 作成日時 = TODAY()
                                        * 説明: APIを実行した日
                                      * 関数名: YESTERDAY()
                                        * 例: 作成日時 = YESTERDAY()
                                        * 説明: APIを実行した日の前日
                                      * 関数名: TOMORROW()
                                        * 例: 日時 = TOMORROW()
                                        * 説明: APIを実行した日の翌日
                                      * 関数名: FROM_TODAY(数字, 期間の単位)
                                        * 例: 作成日時 < FROM_TODAY(5, DAYS)
                                        * 説明: APIを実行した日から起算した期間期間の単位に指定可能な文字列は次のとおりです。DAYS：日単位WEEKS：週単位MONTHS：月単位YEARS：年単位
                                      * 関数名: THIS_WEEK(曜日)
                                        * 例: 作成日時 = THIS_WEEK()
                                        * 説明: APIを実行した週引数に次の値を指定することで、曜日を指定できます。SUNDAY：日曜日MONDAY：月曜日TUESDAY：火曜日WEDNESDAY：水曜日THURSDAY：木曜日FRIDAY：金曜日SATURDAY：土曜日引数を指定しない場合は、今週のすべての日が対象です。
                                      * 関数名: LAST_WEEK(曜日)
                                        * 例: 作成日時 = LAST_WEEK()
                                        * 説明: APIを実行した週の前週引数にTHIS_WEEK()と同じ値を指定することで、曜日を指定できます。引数を指定しない場合は、前週のすべての日が対象です。
                                      * 関数名: NEXT_WEEK(曜日)
                                        * 例: 日時 = NEXT_WEEK()
                                        * 説明: APIを実行した週の翌週引数にTHIS_WEEK()と同じ値を指定することで、曜日を指定できます。引数を指定しない場合は、翌週のすべての日が対象です。
                                      * 関数名: THIS_MONTH(数値またはフォーマット文字)
                                        * 例: 作成日時 = THIS_MONTH()
                                        * 説明: APIを実行した月引数に次の値を指定することで、日付を指定できます。LAST：月末1から31の数値：日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌月1日で計算されます。
                                      * 関数名: LAST_MONTH(数値またはフォーマット文字)
                                        * 例: 作成日時 = LAST_MONTH()
                                        * 説明: APIを実行した月の前月引数に次の値を指定することで、日付を指定できます。LAST：前月末1から31の数値：前月の日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌月1日で計算されます。
                                      * 関数名: NEXT_MONTH(数値またはフォーマット文字)
                                        * 例: 作成日時 = NEXT_MONTH()
                                        * 説明: APIを実行した月の翌月引数に次の値を指定することで、日付を指定できます。LAST：翌月末1から31の数値：翌月の日付引数を指定しない場合は、月のすべての日が対象です。指定した日付が存在しない場合は、APIを実行した月の翌々月1日で計算されます。
                                      * 関数名: THIS_YEAR()
                                        * 例: 作成日時 = THIS_YEAR()
                                        * 説明: APIを実行した年
                                      * 関数名: LAST_YEAR()
                                        * 例: 作成日時 = LAST_YEAR()
                                        * 説明: APIを実行した年の前年
                                      * 関数名: NEXT_YEAR()
                                        * 例: 日時 = NEXT_YEAR()
                                        * 説明: APIを実行した年の翌年

                                      * オプション: order by
                                        * 例: order by 更新日時asc
                                        * 説明: レコードを取得する順番本オプションに続けて指定したフィールドコードの値で並び替えられます。フィールドコードの後にascを指定すると昇順、descを指定すると降順で並び替えられます。複数の項目で並び替える場合、「フィールドコード 並び順」をカンマ区切りで指定します。例：order by フィールドコード1 desc, フィールドコード2 asc省略すると、レコードIDの降順で並び替えされます。order byで指定できるフィールドには制限があります。詳細は次のページを参照してください。        ソートで選択できるフィールド
                                      * オプション: limit
                                        * 例: limit 20
                                        * 説明: 取得するレコード数たとえばlimit 20を指定すると、レコード先頭から20件のレコードを取得します。0から500までの数値を指定できます。省略すると、100が設定されます。
                                      * オプション: offset
                                        * 例: offset 30
                                        * 説明: 取得をスキップするレコード数たとえばoffset 30を指定すると、レコード先頭から30番目までのレコードは取得せず、31番目のレコードから取得します。0から10,000までの数値を指定できます。省略すると、0が設定されます。

                                      #### フィールド、システム識別子ごとの利用可能な演算子と関数一覧

                                      固定リンクがコピーされました

                                      * フィールドまたはシステム識別子: レコード番号
                                        * = != > < >= <= innot in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: $id
                                        * = != > < >= <= in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 作成者
                                        * in not in
                                        * 利用可能な関数: LOGINUSER()
                                      * フィールドまたはシステム識別子: 作成日時
                                        * = != > < >= <=
                                        * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                                      * フィールドまたはシステム識別子: 更新者
                                        * in not in
                                        * 利用可能な関数: LOGINUSER()
                                      * フィールドまたはシステム識別子: 更新日時
                                        * = != > < >= <=
                                        * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                                      * フィールドまたはシステム識別子: 文字列（1行）
                                        * = != in not in like not like
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: リンク
                                        * = != in not in like not like
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 数値
                                        * = != > < >= <= in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 計算
                                        * = != > < >= <= in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 文字列（複数行）
                                        * like not like
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: リッチエディター
                                        * like not like
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: チェックボックス
                                        * in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: ラジオボタン
                                        * in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: ドロップダウン
                                        * in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 複数選択
                                        * in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 添付ファイル
                                        * like not like
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 日付
                                        * = != > < >= <=
                                        * 利用可能な関数: TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                                      * フィールドまたはシステム識別子: 時刻
                                        * = != > < >= <=
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: 日時
                                        * = != > < >= <=
                                        * 利用可能な関数: NOW() TODAY() YESTERDAY() TOMORROW() FROM_TODAY() THIS_WEEK() LAST_WEEK() NEXT_WEEK() THIS_MONTH() LAST_MONTH() NEXT_MONTH() THIS_YEAR() LAST_YEAR() NEXT_YEAR()
                                      * フィールドまたはシステム識別子: ユーザー選択
                                        * in not in
                                        * 利用可能な関数: LOGINUSER()
                                      * フィールドまたはシステム識別子: 組織選択
                                        * in not in
                                        * 利用可能な関数: PRIMARY_ORGANIZATION()
                                      * フィールドまたはシステム識別子: グループ選択
                                        * in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: ステータス
                                        * = != in not in
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: ルックアップ
                                        * ルックアップ元のフィールドタイプと同じ
                                        * 利用可能な関数: ルックアップ元のフィールドタイプと同じ
                                      * フィールドまたはシステム識別子: 関連レコード
                                        * 参照するアプリのフィールドタイプと同じ
                                        * 利用可能な関数: 参照するアプリのフィールドタイプと同じ
                                      * フィールドまたはシステム識別子: グループ
                                        * なし
                                        * 利用可能な関数: なし
                                      * フィールドまたはシステム識別子: カテゴリー
                                        * なし
                                        * 利用可能な関数: なし

                                      次のフィールドの値に、ダブルクオートやバックスラッシュを含む場合、エスケープが必要です。

                                      *   文字列（1行）
                                      *   文字列（複数行）
                                      *   リッチエディター
                                      *   チェックボックス
                                      *   ラジオボタン
                                      *   ドロップダウン
                                      *   複数選択
                                      *   ステータス
                                    `,
                                  },
                                  sort: {
                                    type: "string",
                                  },
                                  revision: {
                                    type: "number"
                                  },
                                },
                                required: [
                                  "index",
                                  "type",
                                  "name",
                                  "fields",
                                  "date",
                                  "title",
                                  "html",
                                  "pager",
                                  "device",
                                  "filterCond",
                                  "sort",
                                  "revision",
                                ],
                                additionalProperties: false
                              }
                            },
                            app: {
                              type: "number",
                              description: "kintone app number"
                            },
                          },
                          required: ["app", "views"],
                          additionalProperties: false
                        },
                        {
                          type: "object",
                          properties: {
                            'properties': {
                              type: "array",
                              description: "kintone app fields list",
                              items: {
                                type: "object",
                                description: "kintone app field properties",
                                properties: {
                                  code: {
                                    type: "string"
                                  },
                                  label: {
                                    type: "string"
                                  },
                                  type: {
                                    type: "string",
                                    enum: [
                                      "GROUP",
                                      "GROUP_SELECT",
                                      "CHECK_BOX",
                                      "SUBTABLE",
                                      "DROP_DOWN",
                                      "USER_SELECT",
                                      "RADIO_BUTTON",
                                      "RICH_TEXT",
                                      "LINK",
                                      "REFERENCE_TABLE",
                                      "CALC",
                                      "TIME",
                                      "NUMBER",
                                      "ORGANIZATION_SELECT",
                                      "FILE",
                                      "DATETIME",
                                      "DATE",
                                      "MULTI_SELECT",
                                      "SINGLE_LINE_TEXT",
                                      "MULTI_LINE_TEXT",
                                    ]
                                  },
                                  noLabel: {
                                    type: "boolean",
                                  },
                                  required: {
                                    type: "boolean",
                                  },
                                  unique: {
                                    type: "boolean",
                                  },
                                  maxValue: {
                                    type: "number",
                                  },
                                  minValue: {
                                    type: "number",
                                  },
                                  maxLength: {
                                    type: "number",
                                    description: "must be greater than or equal to 1"
                                  },
                                  minLength: {
                                    type: "number",
                                    description: "must be greater than or equal to 0"
                                  },
                                  defaultValue: {
                                    type: ["string", "array"],
                                    description: "Initial value. For fields that can set multiple initial values, specify them in array format. If defaultNowValue is specified, the value of defaultNowValue will be set. For user selection/group selection/department selection fields, specify an array of objects with code and type as keys.",
                                    items: {
                                      type: "object",
                                      properties: {
                                        type: {
                                          type: "string",
                                          description: "This is required when specifying the type of initial value for user selection/group selection/department selection fields. Possible values: USER, GROUP, ORGANIZATION, FUNCTION.",
                                          enum: ["USER", "GROUP", "ORGANIZATION", "FUNCTION"]
                                        },
                                        code: {
                                          type: "string",
                                          description: "This is required when specifying the initial value code for the user selection/group selection/department selection field. For user selection fields, it can have one of the following values: The user's login name, Group Code, Organization Code, Function name (LOGINUSER() only). For guest space apps, you can only specify the user, group, and function name. For group selection fields, you can specify a group code. For the organization selection field, you can specify one of the following values: Organization Code, Function name (PRIMARY_ORGANIZATION() only). You cannot specify a deleted or invalid user, group, or organization."
                                        }
                                      },
                                      required: ["type", "code"],
                                      additionalProperties: false
                                    }
                                  },
                                  defaultNowValue: {
                                    type: "boolean"
                                  },
                                  options: {
                                    type: "object",
                                    description: "Setting Choices Required for fields that allow choices, such as radio buttons.",
                                    additionalProperties: {
                                      type: "object",
                                      properties: {
                                        label: {
                                          type: "string",
                                          description: "Specify the same value as the choice name."
                                        },
                                        index: {
                                          type: "integer",
                                          description: "Specify the order of the options with a number. The options will be sorted in ascending order of the specified number."
                                        }
                                      },
                                      required: ["label", "index"]
                                    },
                                  },
                                  align: {
                                    type: "string",
                                    enum: ["HORIZONTAL", "VERTICAL"]
                                  },
                                  expression: {
                                    type: "string",
                                    description: "Auto Calculation FormulaRequired for calculated fields."
                                  },
                                  hideExpression: {
                                    type: "boolean"
                                  },
                                  digit: {
                                    type: "boolean"
                                  },
                                  thumbnailSize: {
                                    type: "number",
                                    enum: [50, 150, 250, 500]
                                  },
                                  protocol: {
                                    type:  "string",
                                    enum: ["WEB", "CALL", "MAIL"],
                                  },
                                  format: {
                                    type: "string",
                                    enum: [
                                      "NUMBER",
                                      "NUMBER_DIGIT",
                                      "DATETIME",
                                      "DATE",
                                      "TIME",
                                      "HOUR_MINUTE",
                                      "DAY_HOUR_MINUTE"
                                    ]
                                  },
                                  displayScale: {
                                    type: "number"
                                  },
                                  unit: {
                                    type: "string",
                                  },
                                  unitPosition: {
                                    type: "string",
                                    enum: ["BEFORE", "AFTER"]
                                  },
                                  entities: {
                                    type: "array",
                                    description: "User selection/Department selection/Group selection field options",
                                    items: {
                                      type: "object",
                                      properties: {
                                        type: {
                                          type: "string",
                                          description: "Required if you specify a choice type.",
                                          enum: ["USER", "GROUP", "ORGANIZATION"]
                                        },
                                        code: {
                                          type: "string",
                                          description: "Required if you specify a choice code. For a user selection field, specify one of the following values: The user's login name, Group Code, Organization Code. For guest space apps, you can only specify users or groups. For group selection fields, specify the group code. For organization selection fields, specify the organization code. You cannot specify a deleted or invalid user/group/organization code."
                                        }
                                      },
                                      required: ["type", "code"],
                                      additionalProperties: false
                                    }
                                  },
                                  // referenceTable schema
                                  // referenceTable: {
                                  //   type: "object",
                                  //   properties: {
                                  //     relatedApp: {
                                  //       type: "object",
                                  //       properties: {
                                  //         app: {
                                  //           type: ["number", "string"],
                                  //         },
                                  //         code: {
                                  //           type: "string"
                                  //         }
                                  //       },
                                  //       required: ["app"]
                                  //     },
                                  //     condition: {
                                  //       type: "object",
                                  //       properties: {
                                  //         field: {
                                  //           type: "string"
                                  //         },
                                  //         relatedField: {
                                  //           type: "string"
                                  //         }
                                  //       },
                                  //       required: ["field", "relatedField"]
                                  //     },
                                  //     filterCond: {
                                  //       type: "string"
                                  //     },
                                  //     displayFields: {
                                  //       type: "array",
                                  //       items: {
                                  //         type: "string"
                                  //       }
                                  //     },
                                  //     sort: {
                                  //       type: "string"
                                  //     },
                                  //     size: {
                                  //       type: ["number", "string"],
                                  //     }
                                  //   },
                                  //   required: [
                                  //     "relatedApp",
                                  //     "condition",
                                  //     "displayFields"
                                  //   ]
                                  // },
                                  // referenceTable: {
                                  //   type: "object",
                                  //   description: "Related Records Field Settings. Required when adding a Related Records field.",
                                  //   required: [
                                  //     "relatedApp",
                                  //     "condition",
                                  //     "displayFields"
                                  //   ],
                                  //   properties: {
                                  //     relatedApp: {
                                  //       type: "object",
                                  //       description: "Reference App settings.",
                                  //       required: [
                                  //         "app"
                                  //       ],
                                  //       properties: {
                                  //         app: {
                                  //           type: ["number", "string"],
                                  //           description: "App ID of the referenced app."
                                  //         },
                                  //         code: {
                                  //           type: "string",
                                  //           description: "App code of the referenced app."
                                  //         }
                                  //       }
                                  //     },
                                  //     condition: {
                                  //       type: "object",
                                  //       description: "Condition for displaying records.",
                                  //       required: [
                                  //         "field",
                                  //         "relatedField"
                                  //       ],
                                  //       properties: {
                                  //         field: {
                                  //           type: "string",
                                  //           description: "Field code of the current app used in the condition."
                                  //         },
                                  //         relatedField: {
                                  //           type: "string",
                                  //           description: "Field code of the related app used in the condition."
                                  //         }
                                  //       }
                                  //     },
                                  //     filterCond: {
                                  //       type: "string",
                                  //       description: "Further narrowing conditions in query format."
                                  //     },
                                  //     displayFields: {
                                  //       type: "array",
                                  //       description: "List of field codes to display.",
                                  //       items: {
                                  //         type: "string"
                                  //       }
                                  //     },
                                  //     sort: {
                                  //       type: "string",
                                  //       description: "Record sorting settings in query format."
                                  //     },
                                  //     size: {
                                  //       type: ["number", "string"],
                                  //       description: "Maximum number of records to display (1, 3, 5, 10, 20, 30, 40, 50). Defaults to 5.",
                                  //       enum: [1, 3, 5, 10, 20, 30, 40, 50, "1", "3", "5", "10", "20", "30", "40", "50"]
                                  //     }
                                  //   }
                                  // },
                                  // lookup schema
                                  openGroup: {
                                    type: "boolean"
                                  },
                                  // fields: {
                                  //   type: "object",
                                  //   description: "A Field object in a table properties has the same structure as in . It is required when adding a table.",
                                  //   // "$ref": "#/definitions/Field"
                                  // },
                                  revision: {
                                    type: "number"
                                  },
                                },
                                required: [
                                  "code",
                                  "label",
                                  "type",
                                  "noLabel",
                                  "required",
                                  "unique",
                                  "maxValue",
                                  "minValue",
                                  "maxLength",
                                  "minLength",
                                  "defaultValue",
                                  "defaultNowValue",
                                  "align",
                                  "expression",
                                  "hideExpression",
                                  "digit",
                                  "thumbnailSize",
                                  "protocol",
                                  "format",
                                  "displayScale",
                                  "unit",
                                  "unitPosition",
                                  "entities",
                                  // "referenceTable",
                                  // "lookup",
                                  "openGroup",
                                  // "fields",
                                  "revision"
                                ],
                                additionalProperties: false
                              }
                            },
                            app: {
                              type: "number",
                              description: "kintone app number"
                            },
                          },
                          required: ["app", "properties"],
                          additionalProperties: false
                        },
                      ]
                    },
                  },
                  required: ["api", "method", "body"],
                  additionalProperties: false
                },
                reference: {
                  type: "array",
                  description: "ユーザーの要望に沿ったタグの情報取得先のID一覧",
                  items: {
                    type: "string",
                    description: "searchRag関数より取得先してきたデータを一意に識別するUUID",
                    example: "7c9339e8-2a5c-4f7c-a1f8-f257bceed7f1"
                  }
                }
              },
              required: ["response_type", "message", "operation", "reference"],
              additionalProperties: false
            }
          },
        }
      };

      const updatedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify(completion_payload)
      });

      if (!updatedResponse.ok) {
        const errorData = await updatedResponse.json();
        throw new Error(`API request failed: ${updatedResponse.status} ${updatedResponse.statusText}\n${JSON.stringify(errorData)}`);
      }

      const updatedData = await updatedResponse.json();
      const assistantResponse = JSON.parse(updatedData.choices[0].message.content);
      console.log(assistantResponse);

      // Process the assistant's response
      if (assistantResponse.response_type === "standard_reply") {
        // Display standard reply message
        let messageWithSource = assistantResponse.message;
        messageWithSource += "\n\n**情報検索先:**\n\n";
        if (assistantResponse.reference.length !== 0) {

          const searchResultJSON = JSON.parse(searchResult);
          for (let i = 0; i < searchResultJSON.length; i++) {
            if(!assistantResponse.reference.includes(searchResultJSON[i].id)){
              continue;
            }

            if (searchResultJSON[i].metadata.page) {
              messageWithSource += `URL: ${searchResultJSON[i].metadata.source}#page=${searchResultJSON[i].metadata.page}\n
            提供元: ${searchResultJSON[i].metadata.provider == "firstparty" ? "サイボウズ公式" : ""}\n`;
            }
            else {
              messageWithSource += `URL: ${searchResultJSON[i].metadata.source}\n
            提供元: ${searchResultJSON[i].metadata.provider == "firstparty" ? "サイボウズ公式" : ""}\n`;
            }
          }
        }

        displayMessage(chatOutput, messageWithSource, "AI", true);
        chatHistory.push({ role: 'assistant', content: assistantResponse.message });
      } else if (assistantResponse.response_type === "kintone_operation") {
        // Display operation message and create a button to execute the operation
        displayMessage(chatOutput, assistantResponse.message, "AI", true);
        chatHistory.push({ role: 'assistant', content: assistantResponse.message });
        createExecuteButton(assistantResponse.operation, chatOutput);
      } else {
        displayMessage(chatOutput, 'No tool calls available.', "AI", false);
      }
    } catch (error) {
      console.error('Error:', error);
      displayMessage(chatOutput, 'Error: Unable to get response from AI', "AI", false);
    }
  }

  function createExecuteButton(operation, chatOutput) {
    const executeButton = document.createElement('button');
    executeButton.textContent = 'kintoneの操作を実行する';
    executeButton.style.padding = '10px';
    executeButton.style.marginTop = '10px';
    executeButton.style.border = 'none';
    executeButton.style.borderRadius = '5px';
    executeButton.style.backgroundColor = '#28a745';
    executeButton.style.color = 'white';
    executeButton.style.cursor = 'pointer';

    executeButton.onclick = () => executekintoneOperation(operation, chatOutput);
    chatOutput.appendChild(executeButton);
  }

  function convertFieldData(inputData) {
    const { app, properties, views, appId } = inputData;
    if(properties) {
      const tempProperties = {};
      for(const property in properties) {
        const {
          code,
          ...props
        } = properties[property];

        tempProperties[code] = {
          code: code,
          ...props
        }
      }

      return {
        app,
        properties: tempProperties
      };
    } else if(views) {
      const tempViews = {};
      for(const view in views) {
        const {
          name,
          ...props
        } = views[view];

        tempViews[name] = {
          name: name,
          ...props
        }
      }

      return {
        app,
        views: tempViews
      };
    } else if(appId) {
      return {
        app: appId
      }
    }
  }

  async function executekintoneOperation(operation, chatOutput) {
    try {
      console.log(operation);
      const body = convertFieldData(operation.body);
      console.log(body);
      if(body.views) {
        const views = await getViewInformation(body.app);
        console.log(views.data.views);

        // Extract existing index values
        const existingIndices = new Set();
        Object.values(views.data.views).forEach(view => {
          if (view.index) existingIndices.add(parseInt(view.index));
        });

        // Find the maximum existing index
        const maxIndex = Math.max(...existingIndices);

        // Assign new, unique indices where needed
        let newIndex = maxIndex + 1;
        Object.keys(body.views).forEach(viewName => {
          const view = body.views[viewName];
          if (!view.index || existingIndices.has(parseInt(view.index))) {
            view.index = newIndex.toString();
            newIndex++;
          }
          existingIndices.add(parseInt(view.index));
        });

        body.views = { ...views.data.views, ...body.views };
        console.log(body.views);
        // const views = await getViewInformation(body.app);
        // console.log(views.data.views);
        // body.views = { ...body.views, ...views.data.views };
        // console.log(body.views);
      }
      const response = await kintone.api(kintone.api.url(operation.api, true), operation.method, body);
      console.log('Operation successful:', response);
      displayMessage(chatOutput, 'kintone operation executed successfully.');
    } catch (error) {
      console.error('Error executing kintone operation:', error);
      displayMessage(chatOutput, 'Failed to execute kintone operation.');
    }
  }

  async function getFieldInformation(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/form/fields.json', true), 'GET', body, (resp) => {
        console.log('Field Information:', resp);
        resolve({ type: 'fields', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching field information:', error);
        // reject(error);
        resolve({ type: 'fields', appId: appId, data: error });
      });
    });
  }

  async function getViewInformation(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/views.json', true), 'GET', body, (resp) => {
        console.log('View Information:', resp);
        resolve({ type: 'views', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching view information:', error);
        reject(error);
      });
    });
  }

  async function getProcessManagementSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', body, (resp) => {
        console.log('Process Management Settings:', resp);
        resolve({ type: 'process', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getFormLayout(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/form/layout.json', true), 'GET', body, (resp) => {
        console.log('Form Layout:', resp);
        resolve({ type: 'layout', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGraphSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/reports.json', true), 'GET', body, (resp) => {
        console.log('Graph Settings:', resp);
        resolve({ type: 'graph', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGeneralSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/settings.json', true), 'GET', body, (resp) => {
        console.log('General Settings:', resp);
        resolve({ type: 'general', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppPlugins(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/plugins.json', true), 'GET', body, (resp) => {
        console.log('App Plug-ins:', resp);
        resolve({ type: 'plugin', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGeneralNotificationSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/general.json', true), 'GET', body, (resp) => {
        console.log('General Notification Settings:', resp);
        resolve({ type: 'generalNotification', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getPerRecordNotificationSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/perRecord.json', true), 'GET', body, (resp) => {
        console.log('Per Record Notification Settings:', resp);
        resolve({ type: 'perRecordNotification', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getReminderNotificationSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/reminder.json', true), 'GET', body, (resp) => {
        console.log('Reminder Notification Settings:', resp);
        resolve({ type: 'reminderNotification', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppPermissions(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/acl.json', true), 'GET', body, (resp) => {
        console.log('App Permissions:', resp);
        resolve({ type: 'appPermissions', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getRecordPermissions(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/record/acl.json', true), 'GET', body, (resp) => {
        console.log('Record Permissions:', resp);
        resolve({ type: 'recordPermissions', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getFieldPermissions(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/field/acl.json', true), 'GET', body, (resp) => {
        console.log('Field Permissions:', resp);
        resolve({ type: 'fieldPermissions', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getActionSettings(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/actions.json', true), 'GET', body, (resp) => {
        console.log('Action Settings:', resp);
        resolve({ type: 'action', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppAdminNotes(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId
      };

      kintone.api(kintone.api.url('/k/v1/app/adminNotes.json', true), 'GET', body, (resp) => {
        console.log('App Admin Notes:', resp);
        resolve({ type: 'adminNotes', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getApp(appId) {
    return new Promise((resolve, reject) => {
      const body = {
        id: appId
      };

      kintone.api(kintone.api.url('/k/v1/app.json', true), 'GET', body, (resp) => {
        console.log('App:', resp);
        resolve({ type: 'app', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  // 1件のレコードを取得するAPIのダミー
  async function getRecord(appId, recordId) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId,
        id: recordId
      };

      kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body, (resp) => {
        console.log('Records:', resp);
        resolve({ type: 'records', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  // 複数のレコードを取得するAPIのダミー
  async function getRecords(appId, query) {
    return new Promise((resolve, reject) => {
      const body = {
        app: appId,
        query: query,
        fields: [],
        totalCount: true,
      };

      kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body, (resp) => {
        console.log('Records:', resp);
        resolve({ type: 'records', appId: appId, data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        // reject(error);
        resolve({ type: 'fieldPermissions', appId: appId, data: error });
      });
    });
  }

  async function searchRag(query) {
    const body = {
      question: query, // ユーザーのクエリを設定
      history: [] // 必要に応じて過去の履歴を追加
    };

    try {
      const res = await kintone.plugin.app.proxy(
        PLUGIN_ID,
        'https://aa4k-hybrid-metadata.api-labs.workers.dev/',
        'POST',
        {}, // HTTPヘッダーが必要ならここで設定
        body
      );

      const bodyContent = res[0]; // レスポンスの最初の要素を取得
      console.log("bodyContent: ", bodyContent);

      return bodyContent; // 必要に応じて返却
    } catch (error) {
      console.error("検索処理中にエラーが発生しました:", error);
      return null; // エラー時にnullを返す
    }
  }


  kintone.events.on(['app.record.index.show', 'app.record.index.edit.show', '	app.record.index.delete.submit'], async (event) => {
    // createChatPopup();
    console.log(event)
    // const suggest = await fetchOpenAISuggestion(event);
    // createSuggestButton(suggest);
  });

  kintone.events.on(['app.record.detail.show', 'app.record.detail.delete.submit', 'app.record.detail.process.proceed'], async (event) => {
    console.log(event)
    // const suggest = await fetchOpenAISuggestion(event);
    // createSuggestButton(suggest);

  });


  kintone.events.on(['app.record.edit.show', 'app.record.edit.submit'], async (event) => {
    console.log(event)
    // const suggest = await fetchOpenAISuggestion(event);
    // createSuggestButton(suggest);
  });

  kintone.events.on(['app.record.create.show'], async (event) => {
    console.log(event)
    // const suggest = await fetchOpenAISuggestion(event);
    // createSuggestButton(suggest);
  });

  kintone.events.on(['app.report.show'], (event) => {
    console.log(event)
  });

  async function fetchOpenAISuggestion(eventData) {
    var config = kintone.plugin.app.getConfig(PLUGIN_ID);

    const apiEndpoint = 'https://api.openai.com/v1/chat/completions'; // OpenAI APIのエンドポイント

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06', // 使用するOpenAIモデル
        messages: [
          {
            role: 'system',
            content: 'あなたはkintone AIアシスタントです。ユーザーから与えられたイベントデータを元に、ユーザーが次に実行するべき操作やアクションに関するサジェストをボタン表示用の短い文言で作成してください。返答は、"button"キーのJSONオブジェクトとして返してください。'
          },
          { role: 'user', content: `kintone イベントデータ: ${JSON.stringify(eventData)}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "suggestion_button",
            strict: true,
            schema: {
              type: "object",
              properties: {
                button: {
                  type: "string",
                  description: "サジェストボタンとして表示する文言。",
                  example: "〇〇というフィールドコードは何のタイプですか？"
                }
              },
              required: ["button"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('OpenAI Suggestion:', data.choices[0].message.content); // 応答の内容をコンソールに出力
      return JSON.parse(data.choices[0].message.content).button; // サジェスト内容を返す
    } else {
      console.error('OpenAI APIリクエストに失敗しました:', response.statusText);
    }
  }


  function monitorXMLHttpRequests() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;

      // this.addEventListener('readystatechange', function () {
      //   console.log("readystatechange to:", this.readyState);
      // });

      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      console.log("Request to:", this._url);

      // 正常なレスポンスの場合
      this.addEventListener('load', function () {
        console.log("Response from:", this._url, "Status:", this.status);
        if (this.status >= 200 && this.status < 300) {
          console.log("Success response:", this.responseText);
          const res = JSON.parse(this.responseText)
          if (res && typeof res === 'object' && res.code) {
            // 追加の通知処理
            const event = new CustomEvent('kintoneError', {
              detail: res
            });
            document.dispatchEvent(event);
          }
        } else {
          console.log("Non-success response:", this.status, this.statusText);
        }
      });

      // エラー発生時の処理
      this.addEventListener('error', function () {
        console.error("Error during request to:", this._url);
      });

      // タイムアウト時の処理
      this.addEventListener('timeout', function () {
        console.error("Request to:", this._url, "timed out.");
      });

      // 通信が中断された場合
      this.addEventListener('abort', function () {
        console.warn("Request to:", this._url, "was aborted.");
      });

      return originalSend.apply(this, arguments);
    };
  }

  // 関数を呼び出してXMLHttpRequestを監視
  monitorXMLHttpRequests();

  document.addEventListener('kintoneError', function (event) {
    const errorMessage = JSON.stringify(event.detail);
    document.getElementById("ai_input").value = 'エラーが発生しました。理由を調査してください\n' + errorMessage
  });

  createChatPopup();


})(kintone.$PLUGIN_ID);
