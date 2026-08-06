import { formatMessage } from './message-formatter';

describe('formatMessage', () => {
  it('substitutes known placeholders in both subject and body', () => {
    const result = formatMessage(
      {
        subject: 'Welcome, {{name}}!',
        body: 'Hi {{name}}, your code is {{code}}.',
      },
      { name: 'Jane', code: '123456' },
    );

    expect(result).toEqual({
      subject: 'Welcome, Jane!',
      body: 'Hi Jane, your code is 123456.',
    });
  });

  it('leaves unknown placeholders untouched', () => {
    const result = formatMessage(
      { subject: 'Hello {{name}}', body: 'Code: {{code}}' },
      { name: 'Jane' },
    );

    expect(result).toEqual({
      subject: 'Hello Jane',
      body: 'Code: {{code}}',
    });
  });

  it('returns the template unchanged when there are no placeholders', () => {
    const result = formatMessage(
      { subject: 'Welcome!', body: 'Thanks for joining.' },
      {},
    );

    expect(result).toEqual({
      subject: 'Welcome!',
      body: 'Thanks for joining.',
    });
  });
});
