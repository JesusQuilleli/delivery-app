const path = require('path');
const fs = require('fs');
const { Client } = require(path.resolve(__dirname, '../backend/node_modules/ssh2'));

let vpsPassword = process.env.VPS_PASSWORD || '';
if (!vpsPassword) {
  const vpsTxtPath = path.resolve(__dirname, '../VPS.txt');
  if (fs.existsSync(vpsTxtPath)) {
    const content = fs.readFileSync(vpsTxtPath, 'utf8');
    const match = content.match(/Contraseña:\s*([^\r\n]+)/i);
    if (match) vpsPassword = match[1].trim();
  }
}

const VPS_CONFIG = {
  host: process.env.VPS_HOST || '166.0.112.243',
  port: parseInt(process.env.VPS_PORT || '22', 10),
  username: process.env.VPS_USER || 'root',
  password: vpsPassword,
  readyTimeout: 30000
};

function runSSHCommand(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`\n💻 [VPS :: EXEC] > ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let output = '';
        let errorOutput = '';

        stream.on('close', (code, signal) => {
          conn.end();
          if (code === 0) {
            resolve(output);
          } else {
            const err = new Error(`Comando falló con código ${code}: ${errorOutput || output}`);
            err.code = code;
            reject(err);
          }
        }).on('data', (data) => {
          const str = data.toString();
          output += str;
          process.stdout.write(str);
        }).stderr.on('data', (data) => {
          const str = data.toString();
          errorOutput += str;
          process.stderr.write(str);
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(VPS_CONFIG);
  });
}

function uploadFileSFTP(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        console.log(`📤 [SFTP] Subiendo ${localPath} -> ${remotePath}...`);
        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        writeStream.on('close', () => {
          console.log(`✅ [SFTP] Subido con éxito: ${remotePath}`);
          conn.end();
          resolve();
        });
        writeStream.on('error', (err) => {
          conn.end();
          reject(err);
        });
        readStream.pipe(writeStream);
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(VPS_CONFIG);
  });
}

module.exports = { runSSHCommand, uploadFileSFTP, VPS_CONFIG };
