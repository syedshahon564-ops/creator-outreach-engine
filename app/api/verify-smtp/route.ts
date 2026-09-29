import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection } from '@/lib/emailService';
import { OutreachConfig } from '@/types/outreach';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const config: Partial<OutreachConfig> = {
      smtpHost: body.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: Number(body.smtpPort || process.env.SMTP_PORT || 465),
      smtpSecure: body.smtpSecure !== undefined ? body.smtpSecure : true,
      smtpUser: body.smtpUser || process.env.SMTP_USER || '',
      smtpPass: body.smtpPass || process.env.SMTP_PASS || '',
    };

    if (!config.smtpUser || !config.smtpPass) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP user and password are required. Set in .env.local or enter in configuration.',
          latencyMs: 0,
        },
        { status: 400 }
      );
    }

    const result = await testSmtpConnection(config);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error while verifying SMTP',
        latencyMs: 0,
      },
      { status: 500 }
    );
  }
}
