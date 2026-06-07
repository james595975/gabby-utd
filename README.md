This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Instagram Feed

Set these environment variables in Vercel to show recent Instagram posts on the home news section:

```bash
INSTAGRAM_USER_ID=your_instagram_business_or_creator_user_id
INSTAGRAM_ACCESS_TOKEN=your_meta_graph_api_access_token
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/your_account/
```

`INSTAGRAM_ACCESS_TOKEN` must stay server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Inquiry Email

Testmail receives emails at `sc31e.{tag}@inbox.testmail.app`. It is the inbox used to capture inquiry notification emails, not the SMTP sender itself. Use any SMTP provider for sending, and route admin notifications to Testmail.

```bash
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=your_verified_from_address

TESTMAIL_NAMESPACE=sc31e
INQUIRY_NOTIFICATION_EMAIL=sc31e.admin@inbox.testmail.app
TESTMAIL_CAPTURE_AUTOREPLY=false
```

If `INQUIRY_NOTIFICATION_EMAIL` is omitted, admin notifications default to `sc31e.admin@inbox.testmail.app`. Set `TESTMAIL_CAPTURE_AUTOREPLY=true` only when testing auto-replies; it sends user auto-replies to `sc31e.auto-reply@inbox.testmail.app` instead of the submitter.

SMTP credentials must stay server-only. Do not prefix them with `NEXT_PUBLIC_`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
