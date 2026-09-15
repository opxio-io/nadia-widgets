# Nadia Widgets

Private personal widgets, separate from Shin Supplies.

## University Study HQ

Live Notion dashboard: `public/study-hq.html`

The browser calls `/api/study-hq`. The API reads Courses, Academic Tasks, Study Sessions and Class Schedule from Notion while keeping the Notion integration secret on the server.

### Deploy on Vercel

1. Import `opxio-io/nadia-widgets` into Vercel.
2. In Project Settings > Environment Variables add `STUDY_NOTION_API_KEY` with your Notion integration secret.
3. Deploy.
4. Open `https://YOUR-VERCEL-DOMAIN/study-hq.html` and embed that URL in Notion.

Do not put the Notion secret in the HTML or commit it to GitHub.
