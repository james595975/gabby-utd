import { NextResponse } from 'next/server';

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

const GRAPH_VERSION = 'v24.0';

export async function GET() {
  const igUserId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    return NextResponse.json({ posts: [] });
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', '3');
  url.searchParams.set('access_token', accessToken);

  try {
    const response = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('Instagram media fetch failed:', message);
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    const payload = await response.json();
    const posts = (payload.data || []).map((item: InstagramMediaItem) => ({
      id: item.id,
      caption: item.caption || 'Instagram 게시글',
      image_url: item.thumbnail_url || item.media_url || null,
      permalink: item.permalink || null,
      timestamp: item.timestamp || null,
      media_type: item.media_type || null,
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Instagram media fetch error:', error);
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}
