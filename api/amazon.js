import { client, execute } from "./_common.js";

export default async function handler(req, res) {
    try {
        await execute(process.env.AMAZON_API_URL);
        res.status(200).send('get');
    } catch (err) {
        console.log(err);
        res.status(500).send('error');
    }
}