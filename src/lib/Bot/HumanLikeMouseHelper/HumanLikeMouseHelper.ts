import { createCursor, installMouseHelper } from "ghost-cursor";

// Définition d'une "interface" pour la gestion de la souris
interface IHumanLikeMouseHelper {
  initConfig(page);
  move(selector);
  click(selector);
}

class GhostCursorHelper implements IHumanLikeMouseHelper {
  private cursor;
  constructor() {}

  async initConfig(page) {
    this.cursor = await createCursor(page);
    await installMouseHelper(page);
  }

  // Déplacer la souris sur un élément
  async move(selector) {
    await this.cursor.move(selector); // Déplacer la souris comme un humain
  }

  // Cliquer sur un élément
  async click(selector) {
    await this.cursor.click(selector); // Simule un clic sur l'élément
  }
}


// Crée une instance de GhostCursorHelper
const humanLikeMouseHelper:IHumanLikeMouseHelper = new GhostCursorHelper();

// Export de l'interface et de l'instance
export { IHumanLikeMouseHelper, humanLikeMouseHelper };
