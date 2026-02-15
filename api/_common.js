import { TwitterApi } from "twitter-api-v2";
import https from 'https';
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export const appKey = process.env.TWITTER_API_KEY;
export const appSecret = process.env.TWITTER_API_SECRET;
export const accessToken = process.env.TWITTER_ACCESS_TOKEN;
export const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

export const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});
client.readWrite;

export const execute = async (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async() => {
                try {
                    var body = JSON.parse(data)
                    var tweetText = body.tweetText;
                    console.log(tweetText);
                    await client.v2.tweet(tweetText);
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
};

/**
 * OpenAI API (POST /v1/responses) を呼び出す
 */
export const callOpenAI = async (userText) => {
    const response = await axios.post(
        "https://api.openai.com/v1/responses",
        {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: "あなたは実際に商品を使った個人ユーザーです。AIっぽい文章や広告っぽい表現は禁止です。",
                        },
                    ],
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: userText,
                        },
                    ],
                },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
    );
    console.log("[openai] response data:", JSON.stringify(response.data));
    const text = response.data.output[1].content[0].text;
    return text;
};

/**
 * スレッド形式で投稿する（投稿1 → 投稿1へのリプライとして投稿2）
 */
export const tweetThread = async (firstTweet, secondTweet) => {
    const first = await client.v2.tweet(firstTweet);
    console.log("[thread] first tweet id:", first.data.id);
    const second = await client.v2.reply(secondTweet, first.data.id);
    console.log("[thread] reply tweet id:", second.data.id);
    return { first, second };
};

/**
 * 画像URLからダウンロードしてX APIにアップロードし、media_idを返す
 * メディアアップロードはv1.1 (OAuth 1.0a) を使用
 */
export const uploadImageFromUrl = async (imageUrl) => {
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    console.log("[media] downloaded image, size:", buffer.length);
    const mediaId = await client.v1.uploadMedia(buffer, { mimeType: "image/jpeg" });
    console.log("[media] uploaded, media_id:", mediaId);
    return mediaId;
};

/**
 * OAuth 2.0 refresh_token でアクセストークンを取得する
 * リフレッシュトークンはSupabaseから取得し、新しいトークンを保存する
 */
const getOAuth2Token = async () => {
    // Supabaseからリフレッシュトークンを取得
    const { data: row, error: fetchErr } = await supabase
        .from("x_tokens")
        .select("refresh_token")
        .eq("id", 1)
        .single();
    if (fetchErr) throw new Error("[oauth2] supabase fetch error: " + fetchErr.message);
    console.log("[oauth2] refresh_token from supabase:", row.refresh_token);

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", row.refresh_token);
    params.append("client_id", process.env.X_CLIENT_ID);
    console.log("[oauth2] token request body:", params.toString());
    console.log("[oauth2] token request auth:", { username: process.env.X_CLIENT_ID, password: process.env.X_API_APP_SECRET });
    const res = await axios.post(
        "https://api.x.com/2/oauth2/token",
        params,
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            auth: {
                username: process.env.X_CLIENT_ID,
                password: process.env.X_API_APP_SECRET,
            },
        }
    );
    console.log("[oauth2] token response:", JSON.stringify(res.data));

    // 新しいリフレッシュトークンをSupabaseに保存
    if (res.data.refresh_token) {
        console.log("[oauth2] new refresh_token:", res.data.refresh_token);
        const { error: updateErr } = await supabase
            .from("x_tokens")
            .update({ refresh_token: res.data.refresh_token, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (updateErr) console.error("[oauth2] supabase update error:", updateErr.message);
        else console.log("[oauth2] new refresh_token saved to supabase");
    }

    return res.data.access_token;
};

export const tweetWithOAuth2 = async (text) => {
    const token = await getOAuth2Token();
    const body = { text };
    console.log("[oauth2] tweet request body:", JSON.stringify(body));
    const res = await axios.post(
        "https://api.x.com/2/tweets",
        body,
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        }
    );
    console.log("[oauth2] tweet response:", JSON.stringify(res.data));
    return res.data;
};

export const tweetThreadWithOAuth2 = async (firstTweet, secondTweet, mediaIds) => {
    const token = await getOAuth2Token();
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
    const firstBody = { text: firstTweet };
    if (mediaIds && mediaIds.length > 0) {
        firstBody.media = { media_ids: mediaIds };
    }
    console.log("[oauth2] first tweet request:", JSON.stringify(firstBody));
    const first = await axios.post(
        "https://api.x.com/2/tweets",
        firstBody,
        { headers }
    );
    console.log("[oauth2] first tweet response:", JSON.stringify(first.data));
    const secondBody = { text: secondTweet, reply: { in_reply_to_tweet_id: first.data.data.id } };
    console.log("[oauth2] second tweet request:", JSON.stringify(secondBody));
    const second = await axios.post(
        "https://api.x.com/2/tweets",
        secondBody,
        { headers }
    );
    console.log("[oauth2] second tweet response:", JSON.stringify(second.data));
    return { first: first.data, second: second.data };
};

export { axios };