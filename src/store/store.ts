
interface Store {
  botData: any;
}

class Store implements Store {
  botData = null;

  setBotData(data: any) {
    this.botData = data;
  }
  
  getBotData() {
    return this.botData;
  }
}

export default new Store();


