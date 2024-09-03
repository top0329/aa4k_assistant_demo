(function (PLUGIN_ID) {
  kintone.events.on('app.record.index.show', () => {
    createChatPopup();
  });


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
      messageElement.style.backgroundColor = '#5a9bd4';  // AIメッセージの背景色を淡い青色に設定
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
    try {
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
              content: "あなたはKintoneの専門的なサポートAIです。ユーザーの入力言語を検出し、その言語で応答を生成します。ユーザーの要求に応じてKintone APIを呼び出します。例えば、フィールド情報やレコード情報の取得、特定のデータの更新、あるいは新しいフィールドの追加などです。特に、ユーザーが「更新者を一覧に追加する」などの具体的な要求をした場合、必要なフィールド情報とビュー設定の両方を事前に収集し、適切な操作を実行するためのステップを明確に説明します。これにより、ユーザーがどのような操作が行われるのかを正確に理解できるようサポートします。Kintoneの一覧設定を取得する場合は`views`を指定し、フィールド情報を取得する場合は`fields`を指定する必要があります。どちらも重要な要素であるため、適切に呼び出すようにしてください。具体的な操作内容や目的について詳しく説明し、ユーザーに安心感を与えます。"
            },
            { role: 'user', content: message }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "getKintoneAppInfo",
                description: "Retrieve specified types of information from a Kintone app.",
                strict: true,
                parameters: {
                  type: "object",
                  properties: {
                    info_types: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["fields", "views", "process"],
                        description: "Specify the types of information to retrieve: 'fields' for field definitions, 'views' for view configurations, 'process' for process management settings."
                      },
                      description: "Types of information to retrieve from the Kintone app. Options include: 'fields' (for field information), 'views' (for view settings), 'process' (for process management settings). To retrieve the list view settings, 'views' must be specified."
                    }
                  },
                  required: ["info_types"],
                  additionalProperties: false
                }
              }
            }
          ]
        })
      });

      const data = await response.json();
      console.log(data)

      if (data.choices[0].message.content) {
        displayMessage(chatOutput, data.choices[0].message.content, "AI", true);
      }

      const toolCalls = data.choices[0].message.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const results = [];

        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.function.arguments);
            const infoTypes = args.info_types;

            for (const infoType of infoTypes) {
              switch (infoType) {
                case "fields":
                  results.push(await getFieldInformation());
                  displayMessage(chatOutput, "フィールド情報が正常に取得されました。", "AI", false);
                  break;
                case "views":
                  results.push(await getViewInformation());
                  displayMessage(chatOutput, "ビュー情報が正常に取得されました。", "AI", false);
                  break;
                case "process":
                  results.push(await getProcessManagementSettings());
                  displayMessage(chatOutput, "プロセス管理情報が正常に取得されました。", "AI", false);
                  break;
                default:
                  console.error('Unknown info type:', infoType);
              }
            }
          }

          // Send the results back to OpenAI
          const completion_payload = {
            model: 'gpt-4o-2024-08-06',
            messages: [
              {
                role: 'system',
                content: `あなたはKintoneアプリに関する情報を提供する役立つアシスタントです。アプリIDは${kintone.app.getId()}です。ユーザーが実行したい特定のタスクについて、Kintoneでの操作をガイドします。
                各ステップで実行される操作について詳しく説明し、ユーザーが全体の流れを明確に理解できるようにします。
                また、ユーザーの入力言語を検出し、その言語で応答を提供することで、ユーザーにとってより親しみやすいコミュニケーションを実現します。
                フィールドの追加やレコードの更新など、どのような操作が行われるのかを丁寧に説明してください。

                Kintoneアプリの一覧画面を操作する際、以下の項目が必須となります：

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

                上記の内容を元に、適切なKintone操作を行います。`
              },
              { role: 'user', content: message },
              {
                ...data.choices[0].message,
                content: null
              },
              ...toolCalls.map((toolCall, index) => ({
                role: "tool",
                content: JSON.stringify(results[index]),
                tool_call_id: toolCall.id,
                name: toolCall.function.name
              }))
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
                          description: "The Kintone API endpoint to be called."
                        },
                        method: {
                          type: "string",
                          enum: ["GET", "POST", "PUT"],
                          description: "The HTTP method to be used for the API call."
                        },
                        body: {
                          anyOf: [
                            {
                              type: "string",
                              description: "This JSON string represents the request body for updating or creating a list view in a Kintone app. The 'views' object specifies the view settings, including the view name, index, and type. Use this format when you need to manage list views.",
                              example: `{
                                "app": 123,
                                "views": {
                                  "一覧名": {
                                    "name": "一覧名",
                                    "index": 1,
                                    "type": "LIST"
                                  }
                                }
                              }`
                            },
                            {
                              type: "string",
                              description: "This JSON string represents the request body for managing process settings in a Kintone app. The 'states' object specifies the process management settings, including the state name and its order. Use this format when you need to configure or update process management.",
                              example: `{
                                "app": 123,
                                "enable": true,
                                "states": {
                                  "未処理": {
                                    "name": "未処理",
                                    "index": 0
                                  }
                                }
                              }`
                            }
                          ]
                        },
                        required: ["api", "method", "body"],
                        additionalProperties: false
                      }
                    },
                    required: ["response_type", "message", "operation"],
                    additionalProperties: false
                  }
                }
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

            const updatedData = await updatedResponse.json();
            const assistantResponse = JSON.parse(updatedData.choices[0].message.content);

            // Process the assistant's response
            if(assistantResponse.response_type === "standard_reply") {
              // Display standard reply message
              // displayMessage(chatOutput, 'AI: ' + marked.parse(assistantResponse.message));
              displayMessage(chatOutput, assistantResponse.message, "AI", true);

        } else if (assistantResponse.response_type === "kintone_operation") {
          // Display operation message and create a button to execute the operation
          displayMessage(chatOutput, assistantResponse.message, "AI", true);

          createExecuteButton(assistantResponse.operation, chatOutput);
        }

      } else {
        displayMessage(chatOutput, 'No tool calls available.', "AI", false);
      }
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

  executeButton.onclick = () => executeKintoneOperation(operation, chatOutput);
  chatOutput.appendChild(executeButton);
}

async function executeKintoneOperation(operation, chatOutput) {
  try {
    // Convert operation body back to JSON if needed
    const body = JSON.parse(operation.body);
    const response = await kintone.api(kintone.api.url(operation.api, true), operation.method, body);
    console.log('Operation successful:', response);
    displayMessage(chatOutput, 'Kintone operation executed successfully.');
  } catch (error) {
    console.error('Error executing Kintone operation:', error);
    displayMessage(chatOutput, 'Failed to execute Kintone operation.');
  }
}

async function getFieldInformation() {
  return new Promise((resolve, reject) => {
    const body = {
      app: kintone.app.getId()
    };

    kintone.api(kintone.api.url('/k/v1/app/form/fields.json', true), 'GET', body, (resp) => {
      console.log('Field Information:', resp);
      resolve({ type: 'fields', data: resp });
    }, (error) => {
      console.error('Error fetching field information:', error);
      reject(error);
    });
  });
}

async function getViewInformation() {
  return new Promise((resolve, reject) => {
    const body = {
      app: kintone.app.getId()
    };

    kintone.api(kintone.api.url('/k/v1/app/views.json', true), 'GET', body, (resp) => {
      console.log('View Information:', resp);
      resolve({ type: 'views', data: resp });
    }, (error) => {
      console.error('Error fetching view information:', error);
      reject(error);
    });
  });
}

async function getProcessManagementSettings() {
  return new Promise((resolve, reject) => {
    const body = {
      app: kintone.app.getId()
    };

    kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', body, (resp) => {
      console.log('Process Management Settings:', resp);
      resolve({ type: 'process', data: resp });
    }, (error) => {
      console.error('Error fetching process management settings:', error);
      reject(error);
    });
  });
}

}) (kintone.$PLUGIN_ID);
