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
              content: `あなたはKintoneの専門的なサポートAIです。
              ユーザーの入力言語を検出し、その言語で応答を生成します。
              以下の場合は、Kintone APIを呼び出して関連する情報を収集してください。
              - 操作がアプリの設定の参照・変更を含む場合
              - 権限の設定が必要な場合
              Kintone APIを呼び出すために指定する info_types とAPIのパスの一覧は以下のとおりです。
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
              ユーザーの要求を実現するために必要な操作をステップに分けて明確に説明してください。`
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
                      description: `Types of information to retrieve from the Kintone app.
                      To retrieve the list view settings, 'views' must be specified.`
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
        displayMessage(chatOutput, data.choices[0].message.content,"AI",true);
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
                  displayMessage(chatOutput, "フィールド情報が正常に取得されました。","AI", false);
                  break;
                case "views":
                  results.push(await getViewInformation());
                  displayMessage(chatOutput, "ビュー情報が正常に取得されました。","AI", false);
                  break;
                case "process":
                  results.push(await getProcessManagementSettings());
                  displayMessage(chatOutput, "プロセス管理情報が正常に取得されました。","AI", false);
                  break;
                case "layout":
                  results.push(await getFormLayout());
                  displayMessage(chatOutput, "フォームのレイアウト情報が正常に取得されました。","AI", false);
                  break;
                case "graph":
                  results.push(await getGraphSettings());
                  displayMessage(chatOutput, "アプリのグラフの設定が正常に取得されました。","AI", false);
                  break;
                case "general":
                  results.push(await getGeneralSettings());
                  displayMessage(chatOutput, "アプリの一般設定が正常に取得されました。","AI", false);
                  break;
                case "plugin":
                  results.push(await getAppPlugins());
                  displayMessage(chatOutput, "アプリに追加されているプラグインが正常に取得されました。","AI", false);
                  break;
                case "generalNotification":
                  results.push(await getGeneralNotificationSettings());
                  displayMessage(chatOutput, "アプリの条件通知の設定が正常に取得されました。","AI", false);
                  break;
                case "perRecordNotification":
                  results.push(await getPerRecordNotificationSettings());
                  displayMessage(chatOutput, "レコードの条件通知の設定が正常に取得されました。","AI", false);
                  break;
                case "reminderNotification":
                  results.push(await getReminderNotificationSettings());
                  displayMessage(chatOutput, "リマインダーの条件通知の設定が正常に取得されました。","AI", false);
                  break;
                case "appPermissions":
                  results.push(await getAppPermissions());
                  displayMessage(chatOutput, "アプリのアクセス権の設定が正常に取得されました。","AI", false);
                  break;
                case "recordPermissions":
                  results.push(await getRecordPermissions());
                  displayMessage(chatOutput, "レコードのアクセス権の設定が正常に取得されました。","AI", false);
                  break;
                case "fieldPermissions":
                  results.push(await getFieldPermissions());
                  displayMessage(chatOutput, "フィールドのアクセス権の設定が正常に取得されました。","AI", false);
                  break;
                case "action":
                  results.push(await getActionSettings());
                  displayMessage(chatOutput, "アプリのアクション設定が正常に取得されました。","AI", false);
                  break;
                case "adminNotes":
                  results.push(await getAppAdminNotes());
                  displayMessage(chatOutput, "アプリの管理者用メモが正常に取得されました。","AI", false);
                  break;
                case "app":
                  results.push(await getApp());
                  displayMessage(chatOutput, "1件のアプリの情報が正常に取得されました。","AI", false);
                  break;
                case "record":
                  results.push(await getRecord());
                  displayMessage(chatOutput, "1件のレコードが正常に取得されました。","AI", false);
                  break;
                case "records":
                  results.push(await getRecords());
                  displayMessage(chatOutput, "複数のレコードが正常に取得されました。","AI", false);
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
                          type: "string",
                          description: "The JSON string representing the request body for the API call.",
                          example: `{
                            "app": 123,
                            "views": {
                              "一覧名": {
                                "index": "1",
                                "type": "LIST"
                              }
                            }
                          }`
                        }
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
          if (assistantResponse.response_type === "standard_reply") {
            // Display standard reply message
            // displayMessage(chatOutput, 'AI: ' + marked.parse(assistantResponse.message));
            displayMessage(chatOutput, assistantResponse.message,"AI", true);

          } else if (assistantResponse.response_type === "kintone_operation") {
            // Display operation message and create a button to execute the operation
            displayMessage(chatOutput, assistantResponse.message,"AI", true);

            createExecuteButton(assistantResponse.operation, chatOutput);
          }

        } else {
          displayMessage(chatOutput, 'No tool calls available.',"AI",false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      displayMessage(chatOutput, 'Error: Unable to get response from AI',"AI", false);
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

  async function getFormLayout() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/form/layout.json', true), 'GET', body, (resp) => {
        console.log('Form Layout:', resp);
        resolve({ type: 'layout', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGraphSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/reports.json', true), 'GET', body, (resp) => {
        console.log('Graph Settings:', resp);
        resolve({ type: 'graph', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGeneralSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/settings.json', true), 'GET', body, (resp) => {
        console.log('General Settings:', resp);
        resolve({ type: 'general', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppPlugins() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/plugins.json', true), 'GET', body, (resp) => {
        console.log('App Plug-ins:', resp);
        resolve({ type: 'plugin', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getGeneralNotificationSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/general.json', true), 'GET', body, (resp) => {
        console.log('General Notification Settings:', resp);
        resolve({ type: 'generalNotification', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getPerRecordNotificationSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/perRecord.json', true), 'GET', body, (resp) => {
        console.log('Per Record Notification Settings:', resp);
        resolve({ type: 'perRecordNotification', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getReminderNotificationSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/notifications/reminder.json', true), 'GET', body, (resp) => {
        console.log('Reminder Notification Settings:', resp);
        resolve({ type: 'reminderNotification', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppPermissions() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/acl.json', true), 'GET', body, (resp) => {
        console.log('App Permissions:', resp);
        resolve({ type: 'appPermissions', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getRecordPermissions() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/record/acl.json', true), 'GET', body, (resp) => {
        console.log('Record Permissions:', resp);
        resolve({ type: 'recordPermissions', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getFieldPermissions() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/field/acl.json', true), 'GET', body, (resp) => {
        console.log('Field Permissions:', resp);
        resolve({ type: 'fieldPermissions', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getActionSettings() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/actions.json', true), 'GET', body, (resp) => {
        console.log('Action Settings:', resp);
        resolve({ type: 'action', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getAppAdminNotes() {
    return new Promise((resolve, reject) => {
      const body = {
        app: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app/adminNotes.json', true), 'GET', body, (resp) => {
        console.log('App Admin Notes:', resp);
        resolve({ type: 'adminNotes', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  async function getApp() {
    return new Promise((resolve, reject) => {
      const body = {
        id: kintone.app.getId()
      };

      kintone.api(kintone.api.url('/k/v1/app.json', true), 'GET', body, (resp) => {
        console.log('App:', resp);
        resolve({ type: 'app', data: resp });
      }, (error) => {
        console.error('Error fetching process management settings:', error);
        reject(error);
      });
    });
  }

  // 1件のレコードを取得するAPIのダミー
  async function getRecord() {
    return null;
  }

  // 複数のレコードを取得するAPIのダミー
  async function getRecords() {
    return null;
  }

})(kintone.$PLUGIN_ID);
