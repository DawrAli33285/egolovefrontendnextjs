import { NextResponse }                    from 'next/server'
import nodemailer                          from 'nodemailer'
import prisma                              from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const body = await req.json()
    const { email, results, pdfBase64 } = body

  
    const bodySize = JSON.stringify(body).length
    console.log('Body size (bytes):', bodySize)
    console.log('Body size (MB):', (bodySize / 1024 / 1024).toFixed(2) + 'MB')
    console.log('pdfBase64 size (MB):', pdfBase64 ? (pdfBase64.length / 1024 / 1024).toFixed(2) + 'MB' : 'none')

    if (!email || !results) {
      return NextResponse.json(
        { message: 'Email and results are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const premiumActive = user.isPremium

    const { global, pillarPercents } = results

    const pillarRows = Object.entries(
      pillarPercents as Record<string, { ego: number; love: number }>
    )
      .map(
        ([id, val]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">Pillar ${id}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">EGO ${val.ego}%</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">LOVE ${val.love}%</td>
        </tr>`
      )
      .join('')

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions: nodemailer.SendMailOptions = {
      from:    `"EgoXLove" <${process.env.SMTP_EMAIL}>`,
      to:      email,
      subject: '📊 Your EgoXLove Free Report',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9f8ff;border-radius:16px;">
          <h1 style="color:#1E1B4B;text-align:center;">Your EGO vs LOVE Report</h1>

          <div style="display:flex;gap:16px;margin:24px 0;">
            <div style="flex:1;background:#fff;border-radius:12px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <div style="font-size:36px;font-weight:900;color:#ca8a04;">${global.ego}%</div>
              <div style="font-size:12px;font-weight:700;color:#ca8a04;margin-top:4px;">🟡 EGO</div>
            </div>
            <div style="flex:1;background:#fff;border-radius:12px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <div style="font-size:36px;font-weight:900;color:#7c3aed;">${global.love}%</div>
              <div style="font-size:12px;font-weight:700;color:#7c3aed;margin-top:4px;">💜 LOVE</div>
            </div>
          </div>

          <h2 style="color:#1E1B4B;font-size:16px;">📊 Pillar Breakdown</h2>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#1E1B4B;color:white;">
                <th style="padding:10px 12px;text-align:left;">Pillar</th>
                <th style="padding:10px 12px;text-align:left;">EGO</th>
                <th style="padding:10px 12px;text-align:left;">LOVE</th>
              </tr>
            </thead>
            <tbody>${pillarRows}</tbody>
          </table>

          <div style="margin-top:32px;text-align:center;">
            <p style="color:#6b7280;font-size:12px;">© 2026 EgoXLove — All rights reserved</p>
          </div>
        </div>
      `,
    }

    if (premiumActive && pdfBase64) {
      mailOptions.attachments = [
        {
          filename:    'EgoXLove-Report.pdf',
          content:     Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ]
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: 'Report sent successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to send report', error: error.message },
      { status: 500 }
    )
  }
}