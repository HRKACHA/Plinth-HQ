import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

/**
 * Send an invite email with a styled HTML template.
 */
export async function sendInviteEmail({ to, inviteLink, role, roleLabel, invitedByName }) {
  const roleBadgeColor = {
    site_engineer: '#3B82F6',
    accounts: '#F59E0B',
    owner: '#8B5CF6',
    project_manager: '#10B981',
  }[role] || '#6B7280';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">PlinthHQ</h1>
                  <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Team Invitation</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hi there,</p>
                  <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                    <strong>${invitedByName}</strong> has invited you to join the team on PlinthHQ — a construction project management platform.
                  </p>
                  <!-- Role Badge -->
                  <div style="margin:0 0 32px;padding:16px 20px;background-color:#f8fafc;border-radius:8px;border-left:4px solid ${roleBadgeColor};">
                    <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Assigned Role</p>
                    <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">${roleLabel}</p>
                  </div>
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${inviteLink}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,${roleBadgeColor} 0%,${roleBadgeColor}dd 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
                          Accept Invitation
                        </a>
                      </td>
                    </tr>
                  </table>
                  <!-- Notes -->
                  <div style="margin:32px 0 0;padding-top:24px;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">⏰ This link expires in <strong>7 days</strong></p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;">If you did not expect this email, you can safely ignore it.</p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} PlinthHQ. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"PlinthHQ" <onboarding@resend.dev>`,
    to,
    subject: "You've been invited to join the team — PlinthHQ",
    html,
  };

  // In development, if API key is missing, just log it
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email Service] RESEND_API_KEY not configured. Logging invite instead of sending.');
    console.log(`[Email Service] To: ${to}`);
    console.log(`[Email Service] Role: ${roleLabel}`);
    console.log(`[Email Service] Link: ${inviteLink}`);
    return { messageId: 'dev-mode-logged', accepted: [to] };
  }

  return transporter.sendMail(mailOptions);
}

export default { sendInviteEmail };
