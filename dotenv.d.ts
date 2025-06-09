declare namespace NodeJS {
	/**
	 * Defines the structure of `process.env` variables for TypeScript.
	 *
	 * @interface ProcessEnv
	 * @author Munir Mardinli <munir@mardinli.de>
	 * @copyright 2025 alertmanager-gotify
	 * @license MIT
	 * @version 1.0.0
	 * @see {@link https://nodejs.org/api/process.html#processenv | Node.js `process.env`}
	 */
	interface ProcessEnv {
		/**
		 * Base URL of the Gotify server for sending alert notifications.
		 *
		 * @description Must include protocol (http/https) and hostname.
		 * @example "https://gotify.example.com/message?token="
		 * @remarks Used for critical system alerts. Ensure SSL/TLS is enabled in production.
		 * @throws {TypeError} If URL is malformed or protocol is missing.
		 * @since 1.0.0
		 */
		GOTIFY_ALERT_URL: string;

		/**
		 * Network port where the Gotify server listens.
		 *
		 * @description Typically 443 (HTTPS) or 80 (HTTP) in production.
		 * @example "443"
		 * @default "9094" (Gotify's default port)
		 * @minimum 1
		 * @maximum 65535
		 * @see {@link https://gotify.net/docs/config | Gotify Port Configuration}
		 */
		GOTIFY_PORT: string;

		/**
		 * Node.js runtime environment identifier.
		 *
		 * @description Determines application behavior (e.g., logging, debugging).
		 * @example "production"
		 * @pattern ^(development|production|test)$
		 * @default "development"
		 * @see {@link https://nodejs.org/api/process.html#processenvnode_env | Node.js `NODE_ENV`}
		 * @deprecated Consider using `APP_ENV` for finer-grained control.
		 */
		NODE_ENV: string;
	}
}
