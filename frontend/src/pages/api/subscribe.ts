import * as process from "process";
import { getPostHogClient } from '@/lib/posthog-server';

const apiKey = process.env.MAILGUN_API_KEY;
const listAddress = process.env.MAILGUN_LIST_ADDRESS;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new FormData();
    form.append('address', req.body.address);
    form.append('subscribed','true');
    form.append('upsert','true');

    const resp = await fetch(
      `https://api.mailgun.net/v3/lists/${listAddress}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64')
        },
        body: form
      }
    );

    const data = await resp.json();
    console.log(data);
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: req.body.address,
      event: 'newsletter_subscribed',
      properties: { email: req.body.address, source: 'api' },
    });
    res.status(200).send(data)
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
