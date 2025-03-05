export interface IBrowserAutomationFramework {
  page: any;
  browser: any;
  init();
  close();
  runAntiDetectTools();
}
