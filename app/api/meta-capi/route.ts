import { type NextRequest, NextResponse } from 'next/server';
import { sendMetaEvents, buildUserData, nowSeconds } from '@/lib/meta-capi';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MetaCapiEventSchema = z.object({
  event_name: z.enum([
    'PageView',
    'ViewContent',
    'AddToCart',
    'InitiateCheckout',
    'Search',
  ]),
  event_id: z.string().max(256).optional(),
  event_source_url: z.string().url().max(1024).optional(),
  custom_data: z.record(z.any()).optional(),
  user_data: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      userId: z.string().optional(),
      fbp: z.string().optional(),
      fbc: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawJson = await req.json().catch(() => null);
    if (!rawJson) {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    const parsed = MetaCapiEventSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { event_name, event_id, event_source_url, custom_data, user_data: clientUserData } = parsed.data;

    // Extract real IP from proxy headers
    const ip =
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      undefined;

    const ua = req.headers.get('user-agent') ?? undefined;

    const userData = buildUserData({
      email: clientUserData?.email,
      phone: clientUserData?.phone,
      firstName: clientUserData?.firstName,
      lastName: clientUserData?.lastName,
      city: clientUserData?.city,
      state: clientUserData?.state,
      postalCode: clientUserData?.postalCode,
      country: 'pk',
      userId: clientUserData?.userId,
      fbp: clientUserData?.fbp,
      fbc: clientUserData?.fbc,
      ip,
      ua,
    });

    await sendMetaEvents([
      {
        event_name,
        event_time: nowSeconds(),
        event_id: event_id ?? `${event_name}-${Date.now()}`,
        event_source_url: event_source_url ?? 'https://executivemochi.pk',
        action_source: 'website',
        user_data: userData,
        custom_data: custom_data ?? undefined,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Meta CAPI Route] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
