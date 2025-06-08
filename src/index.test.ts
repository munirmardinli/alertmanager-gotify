jest.mock('express', () => {
  const express = () => ({
    use: jest.fn(),
    post: jest.fn(),
    listen: jest.fn()
  });
  express.json = jest.fn(() => 'json-middleware');
  express.urlencoded = jest.fn(() => 'urlencoded-middleware');
  return express;
});

jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  return () => ({
    ...originalDayjs(),
    valueOf: jest.fn(() => 1234567890)
  });
});

jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: {} }))
}));

jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn()
}));

jest.mock('cookie-parser', () => jest.fn(() => 'cookie-parser-middleware'));

jest.mock('os', () => ({
  networkInterfaces: jest.fn(() => ({
    lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }]
  }))
}));

import { Server } from './index';
import axios from 'axios';
import schedule from 'node-schedule';
import dayjs from 'dayjs';
import { type Alert } from './types/alert';
import os from 'os';

describe('Server', () => {
  let server: Server;

  const mockAlert: Alert = {
    status: 'firing',
    labels: {
      alertname: 'TestAlert',
      instance: 'test-instance'
    },
    annotations: {
      description: 'Test description'
    },
    startsAt: new Date().toISOString(),
    endsAt: new Date().toISOString()
  };

  beforeAll(() => {
    process.env.GOTIFY_ALERT_URL = 'http://gotify.example.com/message';
    process.env.GOTIFY_PORT = '9094';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (os.networkInterfaces as jest.Mock).mockReturnValue({
      lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }]
    });

    server = new Server();
    (server as any).GOTIFY_URL = 'http://gotify.example.com/message';
  });

  describe('Constructor', () => {
    it('should initialize the Express app correctly', () => {
      expect(server).toBeDefined();
      expect(server['app'].use).toHaveBeenCalledWith('json-middleware');
      expect(server['app'].use).toHaveBeenCalledWith('urlencoded-middleware');
      expect(server['app'].use).toHaveBeenCalledWith('cookie-parser-middleware');
      expect(server['app'].post).toHaveBeenCalledWith('/alert', expect.any(Function));
    });

    it('should configure cleanup job', () => {
      expect(schedule.scheduleJob).toHaveBeenCalledWith('* * * * * *', expect.any(Function));
    });
  });

  describe('handleAlert', () => {
    it('should return 400 for invalid payload', async () => {
      const mockReq = { body: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      await server['handleAlert'](mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if alerts is not an array', async () => {
      const mockReq = { body: { alerts: 'not-an-array' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      await server['handleAlert'](mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid payload: alerts missing or not an array'
      });
    });

    it('should process valid alerts', async () => {
      const mockReq = { body: { alerts: [mockAlert] } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      const mockNext = jest.fn();

      await server['handleAlert'](mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('Alerts forwarded to Gotify');
    });

    it('should pass errors to next()', async () => {
      const mockReq = { body: { alerts: [mockAlert] } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      const mockNext = jest.fn();

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      await server['handleAlert'](mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('processAlerts', () => {
    it('should skip duplicate alerts', async () => {
      const id = server['generateAlertId'](mockAlert);
      server['sentAlerts'].set(id, dayjs().valueOf());

      await server['processAlerts']([mockAlert]);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should send new alerts to Gotify', async () => {
      await server['processAlerts']([mockAlert]);
      expect(axios.post).toHaveBeenCalled();
      expect(server['sentAlerts'].size).toBe(1);
    });

    it('should process multiple alerts in parallel', async () => {
      const alert2 = { ...mockAlert, labels: { ...mockAlert.labels, instance: 'instance-2' } };
      await server['processAlerts']([mockAlert, alert2]);

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(server['sentAlerts'].size).toBe(2);
    });
  });

  describe('sendGotifyNotification', () => {
    it('should throw error if Gotify URL is not configured', async () => {
      (server as any).GOTIFY_URL = undefined;

      await expect(server['sendGotifyNotification'](mockAlert, 'test-id'))
        .rejects.toThrow('Gotify URL not configured');
    });

    it('should send notification with correct priority', async () => {
      (server as any).GOTIFY_URL = 'http://gotify.example.com/message';

      await server['sendGotifyNotification'](mockAlert, 'test-id');

      expect(axios.post).toHaveBeenCalledWith(
        'http://gotify.example.com/message',
        expect.objectContaining({
          title: '🚨 New alert',
          message: 'TestAlert: Test description',
          priority: 5
        })
      );
    });

    it('should use "Resolved" title for resolved alerts', async () => {
      const resolvedAlert = { ...mockAlert, status: 'resolved' };
      await server['sendGotifyNotification'](resolvedAlert, 'test-id');

      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: '✅ Resolved',
          priority: 1
        })
      );
    });

    it('should use summary if description is missing', async () => {
      const alertWithSummary = {
        ...mockAlert,
        annotations: {
          summary: 'Test summary'
        }
      };

      await server['sendGotifyNotification'](alertWithSummary, 'test-id');

      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'TestAlert: Test summary'
        })
      );
    });

    it('should use fallback message if description and summary are missing', async () => {
      const alertWithoutDesc = {
        ...mockAlert,
        annotations: {}
      };

      await server['sendGotifyNotification'](alertWithoutDesc, 'test-id');

      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'TestAlert: No description'
        })
      );
    });

    it('should use "Alert" if alertname is missing', async () => {
      const alertWithoutName = {
        ...mockAlert,
        labels: {}
      };

      await server['sendGotifyNotification'](alertWithoutName, 'test-id');

      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Alert: Test description'
        })
      );
    });
  });

  describe('generateAlertId', () => {
    it('should generate consistent IDs', () => {
      const id = server['generateAlertId'](mockAlert);
      expect(id).toBe('TestAlert|test-instance|firing');
    });

    it('should handle empty values', () => {
      const emptyAlert = {
        status: '',
        labels: {},
        annotations: {}
      };
      const id = server['generateAlertId'](emptyAlert);
      expect(id).toBe('||');
    });

    it('should handle missing properties', () => {
      const alertWithMissingProps = {
        status: 'firing',
        labels: { alertname: 'Test' },
        annotations: {}
      };
      const id = server['generateAlertId'](alertWithMissingProps);
      expect(id).toBe('Test||firing');
    });
  });

  describe('getLocalIP', () => {
    it('should return local IP address', () => {
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        eth0: [
          { family: 'IPv4', address: '192.168.1.100', internal: false }
        ]
      });

      const ip = server['getLocalIP']();
      expect(ip).toBe('192.168.1.100');
    });

    it('should return localhost if no external IP is found', () => {
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        lo: [
          { family: 'IPv4', address: '127.0.0.1', internal: true }
        ]
      });

      const ip = server['getLocalIP']();
      expect(ip).toBe('localhost');
    });

    it('should return localhost for empty network interfaces', () => {
      (os.networkInterfaces as jest.Mock).mockReturnValue({});

      const ip = server['getLocalIP']();
      expect(ip).toBe('localhost');
    });

    it('should return localhost for undefined interfaces', () => {
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        eth0: undefined
      });

      const ip = server['getLocalIP']();
      expect(ip).toBe('localhost');
    });

    it('should skip IPv6 addresses', () => {
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        eth0: [
          { family: 'IPv6', address: '::1', internal: false },
          { family: 'IPv4', address: '192.168.1.100', internal: false }
        ]
      });

      const ip = server['getLocalIP']();
      expect(ip).toBe('192.168.1.100');
    });
  });

  describe('start', () => {
    it('should start server with default port', () => {
      const mockListen = jest.fn().mockImplementation((port, ip, callback) => {
        callback();
        return {} as any;
      });
      (server['app'] as any).listen = mockListen;

      (os.networkInterfaces as jest.Mock).mockReturnValue({
        eth0: [{ family: 'IPv4', address: '192.168.1.100', internal: false }]
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      server.start();

      expect(mockListen).toHaveBeenCalledWith(
        9094,
        '192.168.1.100',
        expect.any(Function)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          server: 'Server running on http://192.168.1.100:9094/',
          alertEndpoint: 'Alert endpoint at http://192.168.1.100:9094/alert',
          environment: 'test'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should start server with custom port', () => {
      process.env.GOTIFY_PORT = '8080';
      const mockListen = jest.fn().mockImplementation((port, ip, callback) => {
        callback();
        return {} as any;
      });
      (server['app'] as any).listen = mockListen;

      (os.networkInterfaces as jest.Mock).mockReturnValue({
        eth0: [{ family: 'IPv4', address: '192.168.1.100', internal: false }]
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      server.start();

      expect(mockListen).toHaveBeenCalledWith(
        8080,
        '192.168.1.100',
        expect.any(Function)
      );

      consoleSpy.mockRestore();
      process.env.GOTIFY_PORT = '9094';
    });
  });

  describe('setupAlertCleanupJob', () => {
    it('should remove old alerts from cache', () => {
      const mockScheduleCallback = (schedule.scheduleJob as jest.Mock).mock.calls[0][1];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const oldTimestamp = 1234567890 - (3 * 60 * 1000);
      server['sentAlerts'].set('old-alert', oldTimestamp);
      server['sentAlerts'].set('recent-alert', 1234567890);

      mockScheduleCallback();

      expect(server['sentAlerts'].has('old-alert')).toBe(false);
      expect(server['sentAlerts'].has('recent-alert')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Removed from cache: old-alert');

      consoleSpy.mockRestore();
    });
  });
});
