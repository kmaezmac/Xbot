import { axios, callOpenAI, tweetThreadWithOAuth2, uploadImageFromUrl } from "./_common.js";

const OPENAI_USER_PROMPT = (itemTitle, features) =>
    `以下の商品情報をもとに、` +
    `・140文字以内・PR感を出さない・実際に使った感想として自然な口調・X（旧Twitter）用の投稿文にして。` +
    `・できるだけ「。」を使いすぎず、絵文字も使いすぎない。ただ、固くなりすぎないようにして。ターゲットは女性で、女性になりきって投稿して。` +
    `・アフィリエイトリンクは本文に含めない。次のポストでリンクを貼るが、「気になる人はリプで」とかはやらない。` +
    `ハッシュタグも商品情報をベースにつける。ただ、ハッシュタグをつけすぎた場合、全体の140文字数制限には気をつける。` +
    `という条件でポストを1つ作成してください。\n\n` +
    `商品名: ${itemTitle}\n特徴: ${features}\n\n` +
    `投稿文のみを返してください。余計な説明は不要です。`;

const CATEGORIES = [
    "All", "Electronics", "Computers", "SmartHome", "Apparel", "Shoes",
    "Jewelry", "Beauty", "PersonalCareAppliances", "Kitchen", "HomeImprovement",
    "Automotive", "Sports", "Outdoors", "Toys", "Baby", "Grocery",
    "OfficeProducts", "Books", "Music", "VideoGames", "Watches", "Luggage",
];

const getAmazonToken = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.AMAZON_CLIENT_ID);
    params.append("client_secret", process.env.AMAZON_CLIENT_SECRET);
    params.append("scope", "creatorsapi/default");

    console.log("[amazon] requesting access token...");
    const res = await axios.post(
        "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log("[amazon] token response:", JSON.stringify(res.data));
    return res.data.access_token;
};

export default async function handler(req, res) {
    try {
        const token = await getAmazonToken();

        const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        console.log("[amazon] selected category:", randomCategory);

        const searchBody = {
            keywords: "",
            searchIndex: randomCategory,
            marketplace: process.env.AMAZON_MARKETPLACE,
            partnerTag: process.env.AMAZON_PARTNER_TAG,
            sortBy: "Featured",
            resources: [
                "Images.Primary.Medium",
                "ItemInfo.Title",
                "ItemInfo.Features",
                "Offers.Listings.Availability",
                "Offers.Listings.DeliveryInfo.IsPrimeEligible",
                "Offers.Summaries.OfferCount",
            ],
        };

        console.log("[amazon] searchItems request:", JSON.stringify(searchBody));
        const searchRes = await axios.post(
            "https://creatorsapi.amazon/catalog/v1/searchItems",
            searchBody,
            {
                headers: {
                    "x-marketplace": "www.amazon.co.jp",
                    "Authorization": `Bearer ${token}, Version 2.3`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("[amazon] searchItems response status:", searchRes.status);
        console.log("[amazon] searchItems response:", JSON.stringify(searchRes.data));

        const items = searchRes.data?.SearchResult?.Items;
        if (!items || items.length === 0) throw new Error("no items found");

        const randomItem = items[Math.floor(Math.random() * items.length)];
        const asin = randomItem.ASIN;
        const title = randomItem.ItemInfo?.Title?.DisplayValue || "";
        const features = (randomItem.ItemInfo?.Features?.DisplayValues || []).slice(0, 3).join(" ");
        const imageUrl = randomItem.Images?.Primary?.Medium?.URL || "";
        const affiliateUrl = `https://www.amazon.co.jp/dp/${asin}?tag=${process.env.AMAZON_PARTNER_TAG}`;

        console.log("[amazon] selected ASIN:", asin);
        console.log("[amazon] title:", title);
        console.log("[amazon] imageUrl:", imageUrl);
        console.log("[amazon] affiliateUrl:", affiliateUrl);

        console.log("[amazon] calling OpenAI...");
        const aiText = await callOpenAI(OPENAI_USER_PROMPT(title, features));
        console.log("[amazon] OpenAI response:", aiText);

        const firstTweet = aiText.substring(0, 140);
        const secondTweet = title.substring(0, 60) + " " + affiliateUrl + " #Amazon #アマゾン #タイムセール #ad #PR";
        console.log("[amazon] firstTweet:", firstTweet);
        console.log("[amazon] secondTweet:", secondTweet);

        const mediaIds = [];
        if (imageUrl) {
            const mediaId = await uploadImageFromUrl(imageUrl);
            mediaIds.push(mediaId);
        }

        await tweetThreadWithOAuth2(firstTweet, secondTweet, mediaIds);
        console.log("[amazon] thread posted successfully");

        res.status(200).send('get');
    } catch (error) {
        console.error("[amazon] error name:", error.name);
        console.error("[amazon] error message:", error.message);
        console.error("[amazon] error status:", error.response?.status);
        console.error("[amazon] error data:", JSON.stringify(error.response?.data));
        console.error("[amazon] error stack:", error.stack);
        res.status(500).send('error');
    }
}
