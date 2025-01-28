// tests/integration/chat.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as chatHandler } from '@/pages/api/chat/route';

describe('Chat API', () => {
  it('should handle initial message correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: "Hi, I'd like to get a quote",
        context: {
          stage: 'initial',
          quoteParams: {}
        }
      }
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBeDefined();
    expect(responseData.context.stage).toBe('gathering_info');
  });

  it('should extract age information correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: "I am 35 years old",
        context: {
          stage: 'gathering_info',
          quoteParams: {}
        }
      }
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.context.quoteParams.age).toBe(35);
  });
});

// tests/integration/quote.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as quoteHandler } from '@/pages/api/quote/route';

describe('Quote API', () => {
  it('should generate quote with valid parameters', async () => {
    const quoteRequest = {
      age: 35,
      gender: 1,
      stateCode: 'AZ',
      flagTobaccoUse: false,
      healthClass: 'Excellent',
      faceAmount: 500000,
      benefitPeriod: 20,
      paymentFreq: 12
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: quoteRequest
    });

    await quoteHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.flagStatus).toBe(true);
    expect(responseData.value.selectedQuote).toBeDefined();
  });

  it('should handle invalid parameters correctly', async () => {
    const invalidRequest = {
      age: 65, // Over age limit
      gender: 1,
      stateCode: 'AZ',
      flagTobaccoUse: false,
      healthClass: 'Excellent',
      faceAmount: 500000,
      benefitPeriod: 20,
      paymentFreq: 12
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidRequest
    });

    await quoteHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.flagStatus).toBe(false);
    expect(responseData.error).toBeDefined();
  });
});

// tests/integration/application.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as applicationHandler } from '@/pages/api/application/route';

describe('Application API', () => {
  it('should start application with valid quote ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        quoteResponseId: 'valid-quote-id'
      }
    });

    await applicationHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data.applicationLinks).toBeDefined();
  });

  it('should handle missing quote ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await applicationHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBeDefined();
  });
});
