const { runSSHCommand } = require('./vps-manager');

async function testResend() {
  const nodeSnippet = `
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  console.log('Testing Resend with key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  
  // Try with configured EMAIL_FROM or onboarding@resend.dev
  const fromOptions = [
    process.env.EMAIL_FROM || 'TiendaFast <no-reply@shop-mg.com>',
    'TiendaFast <onboarding@resend.dev>'
  ];

  for (const from of fromOptions) {
    try {
      console.log('Attempting send from:', from);
      const res = await resend.emails.send({
        from,
        to: 'jqcelis092@gmail.com',
        subject: 'Prueba de Correo TiendaFast',
        text: 'Hola Jesús, esta es una prueba de envío de correo desde TiendaFast.'
      });
      console.log('Result:', res);
      if (!res.error) {
        console.log('SUCCESS with from:', from);
        break;
      }
    } catch (e) {
      console.error('Exception with from:', from, e.message);
    }
  }
}

run();
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`);
  console.log(res);
}

testResend().catch(console.error);
