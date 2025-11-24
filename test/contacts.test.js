const expect = require('chai').expect;
const request = require('supertest');
const { execSync } = require('child_process');

// Require app (Express instance) without starting a separate server
const app = require('../config/app');

describe('Contacts API', function() {
  this.timeout(10000);

  before(function() {
    // Seed DB to ensure schema and demo data exist
    try {
      execSync('node integration/seed.js', { stdio: 'inherit' });
    } catch (e) {
      // if seeding fails, tests may still proceed if DB exists
      console.warn('Seed script failed (continuing):', e.message);
    }
  });

  it('should reject invalid submissions with 400 and errors', async () => {
    const res = await request(app)
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

    const res = await request(app)
      .post('/api/contacts')
      .send(payload)
      .set('Accept', 'application/json');

    expect([200,201]).to.include(res.status);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.nested.property('data.id');
  });
});
