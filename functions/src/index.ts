/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";
import { Resend } from "resend";

const resend = new Resend(functions.config().resend.api_key);

// メール送信テスト関数
export const sendTestEmail = functions.https.onRequest(async (req, res) => {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "yukiyoan@gmail.com",
      subject: "テストメール",
      html: "<strong>Resend + Firebase Functions テスト成功！</strong>",
    });

    res.status(200).send(`送信成功: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error("送信エラー:", error);
    res.status(500).send(`送信失敗: ${error}`);
  }
});
