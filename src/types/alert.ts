/**
 * Interface representing an Alert from AlertManager.
 * @interface Alert
 * @property {string} status - Alert status ('firing' or 'resolved')
 * @property {Object.<string, string>} labels - Key-value pairs of alert labels
 * @property {Object.<string, string>} annotations - Key-value pairs of alert annotations
 */
interface Alert {
  status: string;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
	startsAt?: string;
	endsAt?: string;
	 generatorURL?: string;
}

/**
 * Interface representing the payload structure from AlertManager.
 * @interface AlertManagerPayload
 * @property {Alert[]} alerts - Array of Alert objects
 */
interface AlertManagerPayload {
  alerts: Alert[];
}

export { type AlertManagerPayload, type Alert };
