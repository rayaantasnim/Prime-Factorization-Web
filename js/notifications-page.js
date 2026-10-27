/**
 * PrimeFactor.app — Standalone Notifications Page Controller
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { initNotificationsPage } from './notification-engine.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  initNotificationsPage();
});
