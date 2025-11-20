const { spawn } = require('child_process');
const http = require('http');

function waitForServer(url, timeout = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function ping() {
      http.get(url, (res) => {
        resolve();
      }).on('error', (err) => {
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(ping, 200);
      });
    })();
  });
}

function postJson(path, data, port) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: port || (process.env.PORT || 3000),
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('启动被测服务器...');
  const port = process.env.TEST_PORT || 4001;
  const env = Object.assign({}, process.env, { PORT: port });
  const child = spawn('node', ['config/app.js'], { stdio: ['ignore', 'pipe', 'pipe'], env });

  child.stdout.on('data', d => process.stdout.write(d.toString()));
  child.stderr.on('data', d => process.stderr.write(d.toString()));

  try {
    await waitForServer('http://localhost:' + port + '/health', 8000);
  } catch (e) {
    console.error('服务器未能在超时内启动');
    child.kill();
    process.exit(2);
  }

  let allPassed = true;

  console.log('运行测试：无效提交应返回 400');
  const invalid = await postJson('/api/contacts', { name: '', email: 'bad', subject: '', message: '' }, port);
  if (invalid.status !== 400 || !invalid.body || invalid.body.success !== false || !Array.isArray(invalid.body.errors)) {
    console.error('测试失败：无效提交未按预期返回 400', invalid);
    allPassed = false;
  } else {
    console.log('通过');
  }

  console.log('运行测试：有效提交应返回 success 与 id');
  const valid = await postJson('/api/contacts', { name: '测试', email: 'ok@example.com', subject: 'sub', message: 'hello' }, port);
  if (![200,201].includes(valid.status) || !valid.body || valid.body.success !== true || !valid.body.data || !valid.body.data.id) {
    console.error('测试失败：有效提交未按预期返回成功', valid);
    allPassed = false;
  } else {
    console.log('通过, id=', valid.body.data.id);
  }

  console.log(allPassed ? '全部测试通过' : '有测试未通过');
  child.kill();
  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('运行测试时出错:', err);
  process.exit(3);
});
