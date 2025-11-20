const expect = require('chai').expect;
const request = require('supertest');

// Ensure server is running by requiring app entry (it starts server on require)
require('../config/app');

const base = 'http://localhost:' + (process.env.PORT || 3000);

describe('Contacts API', function() {
  this.timeout(5000);

  it('should reject invalid submissions with 400 and errors', async () => {
    const res = await request(base)
      .post('/api/contacts')
      .send({ name: '', email: 'not-an-email', subject: '', message: '' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('success', false);
    expect(res.body).to.have.property('errors').that.is.an('array');
  });

  it('should accept valid submission and return 201 with id', async () => {
    const payload = {
      name: '测试 用户',
      email: 'valid@example.com',
      subject: '测试主题',
      message: '这是一条测试消息'
    };

    const res = await request(base)
      .post('/api/contacts')
      .send(payload)
      .set('Accept', 'application/json');

    expect([200,201]).to.include(res.status);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.nested.property('data.id');
  });
});
