class TreeDataProviderObserver {
  constructor(provider) {
    this.provider = provider;
  }

  update() {
    this.provider._prepareData();
    this.provider._filterData();
    this.provider.refresh();
  }
}
module.exports = TreeDataProviderObserver;