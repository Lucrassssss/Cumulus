const template = '<h2>Sign in to cumulus</h2>\n<p>Enter this code in the app:</p>\n<p style=\"font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;\">{{ .Token }}</p>\n<p style=\"color:#888;font-size:13px;\">This code expires in 1 hour. If you didnt request it you can ignore this email. </p>';

fetch('https://api.supabase.com/v1/projects/xyzrvgbdnevllwvxqcka/config/auth', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mailer_templates_magic_link_content: template,
    mailer_otp_length: 6
  })
}).then(r => r.json()).then(d => console.log('Template:', d.mailer_templates_magic_link_content, 'Length:', d.mailer_otp_length)).catch(console.error);
