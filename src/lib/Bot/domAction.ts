export class DomAction {
  private page;

  constructor(page) {
    this.page = page;
  }

  async disableClicks() {
    await this.page.evaluate(() => {
      document.body.style.pointerEvents = "none";
    });
  }

  async enableClicks() {
    await this.page.evaluate(() => {
      document.body.style.pointerEvents = "auto";
    });
  }
}
