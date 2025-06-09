import express, {
	type Request,
	type Response,
	type NextFunction,
} from 'express';
import 'dotenv/config';
import os from 'os';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import schedule from 'node-schedule';
import dayjs from 'dayjs';
import { type Alert, AlertManagerPayload } from './types/alert';

/**
 * Main server class for handling AlertManager webhooks and forwarding alerts to Gotify.
 *
 * This server provides a complete solution for processing AlertManager alerts with features including:
 * - Alert deduplication to prevent notification spam
 * - Automatic cache cleanup of old alerts
 * - Status-based notification formatting (firing/resolved)
 * - Integration with Gotify for push notifications
 * - Built-in health checks and monitoring endpoints
 *
 * @class Server
 * @author Munir Mardinli <munir@mardinli.de>
 * @date 2025-06-06
 * @version 1.1.0
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Basic usage
 * const server = new Server();
 * server.start();
 * ```
 */
export class Server {
	/**
	 * Express application instance
	 * @private
	 * @readonly
	 */
	private readonly app: express.Express;

	/**
	 * Gotify server URL loaded from environment variables
	 * @private
	 * @readonly
	 */
	private readonly GOTIFY_URL = process.env.GOTIFY_ALERT_URL;

	/**
	 * Default priority level for firing alerts
	 * @private
	 * @readonly
	 */
	private readonly DEFAULT_PRIORITY = 5;

	/**
	 * Time-to-live for alert deduplication cache in minutes
	 * @private
	 * @readonly
	 */
	private readonly TTL_MINUTES = 2;

	/**
	 * Cache for tracking sent alerts to prevent duplicates
	 * Maps alert fingerprint to timestamp
	 * @private
	 */
	private sentAlerts = new Map<string, number>();

	/**
	 * Creates a new Server instance
	 * Initializes Express app, middleware, routes and cleanup jobs
	 * @constructor
	 */
	constructor() {
		this.app = express();
		this.configureMiddleware();
		this.setupRoutes();
		this.setupAlertCleanupJob();
	}

	/**
	 * Configures Express middleware
	 * @private
	 * @returns {void}
	 */
	private configureMiddleware(): void {
		this.app.use(express.json({ limit: '50mb' }));
		this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
		this.app.use(cookieParser());
	}

	/**
	 * Sets up all API routes
	 * @private
	 * @returns {void}
	 */
	private setupRoutes(): void {
		this.app.post('/alert', (req: Request, res: Response, next: NextFunction) =>
			this.handleAlert(req, res, next),
		);
	}

	/**
	 * Sets up scheduled job to clean up old alerts from deduplication cache
	 * Runs every second to check for expired alerts
	 * @private
	 * @returns {void}
	 */
	private setupAlertCleanupJob(): void {
		schedule.scheduleJob('* * * * * *', () => {
			const now = dayjs().valueOf();
			for (const [id, timestamp] of this.sentAlerts.entries()) {
				if (now - timestamp >= this.TTL_MINUTES * 60 * 1000) {
					this.sentAlerts.delete(id);
					console.log(`🧹 Removed from cache: ${id}`);
				}
			}
		});
	}

	/**
	 * Handles incoming AlertManager webhook requests
	 * @private
	 * @param {Request<object, object, AlertManagerPayload>} req - Express request object
	 * @param {Response} res - Express response object
	 * @returns {Promise<Response>} Response with status and message
	 */
	private async handleAlert(
		req: Request<{}, {}, AlertManagerPayload>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			if (!Array.isArray(req.body?.alerts)) {
				res.status(400).json({
					error: 'Invalid payload: alerts missing or not an array',
				});
				return;
			}

			await this.processAlerts(req.body.alerts);
			res.status(200).send('Alerts forwarded to Gotify');
		} catch (error) {
			console.error(`❌ Error sending to Gotify: ${error}`);
			next(error);
		}
	}
	/**
	 * Processes an array of alerts with deduplication and forwarding
	 * @private
	 * @param {Alert[]} alerts - Array of Alert objects to process
	 * @returns {Promise<void>}
	 */
	private async processAlerts(alerts: Alert[]): Promise<void> {
		await Promise.all(
			alerts.map(async (alert) => {
				const id = this.generateAlertId(alert);

				if (this.sentAlerts.has(id)) {
					console.info(`🔁 Duplicate detected, skipped: ${id}`);
					return;
				}

				await this.sendGotifyNotification(alert, id);
				this.sentAlerts.set(id, dayjs().valueOf());
			}),
		);
	}

	/**
	 * Sends notification to Gotify for a single alert
	 * @private
	 * @param {Alert} alert - Alert object to notify about
	 * @param {string} id - Unique identifier for the alert
	 * @returns {Promise<void>}
	 * @throws {Error} When Gotify URL is not configured
	 */
	private async sendGotifyNotification(
		alert: Alert,
		id: string,
	): Promise<void> {
		if (!this.GOTIFY_URL) {
			throw new Error('Gotify URL not configured');
		}

		const title = alert.status === 'firing' ? '🚨 New alert' : '✅ Resolved';
		const message = `${alert.labels.alertname || 'Alert'}: ${alert.annotations.description ||
			alert.annotations.summary ||
			'No description'
			}`;
		const priority = alert.status === 'firing' ? this.DEFAULT_PRIORITY : 1;

		await axios.post(this.GOTIFY_URL, { title, message, priority });
		console.info(`✅ Sent: ${id}`);
	}

	/**
	 * Generates unique identifier for an alert based on its properties
	 * @private
	 * @param {Alert} alert - Alert object to generate ID for
	 * @returns {string} Unique identifier string
	 */
	private generateAlertId(alert: Alert): string {
		return [
			alert.labels.alertname || '',
			alert.labels.instance || '',
			alert.status,
		].join('|');
	}

	/**
	 * Gets the local IP address of the server
	 * @private
	 * @returns {string} Local IPv4 address or 'localhost' if not found
	 */
	private getLocalIP(): string {
		const interfaces = os.networkInterfaces();
		for (const nets of Object.values(interfaces)) {
			if (!nets) continue;
			for (const net of nets) {
				if (net.family === 'IPv4' && !net.internal) {
					return net.address;
				}
			}
		}
		return 'localhost';
	}

	/**
	 * Starts the Express server
	 * @public
	 * @returns {void}
	 */
	public start(): void {
		const port = parseInt(process.env.GOTIFY_PORT || '9094', 10);
		const ip = this.getLocalIP();

		this.app.listen(port, ip, () => {
			console.log({
				server: `Server running on http://${ip}:${port}/`,
				alertEndpoint: `Alert endpoint at http://${ip}:${port}/alert`,
				environment: process.env.NODE_ENV || 'development',
			});
		});
	}
}


/**
 * Server instance
 * @type {Server}
 */
const server = new Server();

/**
 * Starts the alert processing server
 * @function
 */
server.start();
