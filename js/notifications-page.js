/**
 * PrimeFactor.app — Standalone Notifications Page Controller
 */

import { initGlobalHeader, renderFooter } from "./header.js";
import { initNotificationsPage } from "./notification-engine.js";
import { waitForAuthReady } from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
  initGlobalHeader();
  renderFooter();
  await waitForAuthReady();
  initNotificationsPage();
});
