const fs = require("fs").promises;
class TagManager {
  constructor(tagFilePath) {
    this.tagFilePath = tagFilePath;
    this.tags;
    this.taggedFlows;
    this._populateTags();
  }
  addTag(tag, description) {
    if (tag) {
      tag = tag.trim().replace(/[\s<>]/g, "_");
      this.tags[tag] = description || "";
    }
  }
  removeTag(tag) {
    if (tag) {
      delete this.tags[tag];
      this.taggedFlows.untagAllFlows(tag);
    }
  }
  getTagsForFlow(appName, flowName) {
    return this.taggedFlows.getTagsForFlow(appName, flowName);
  }

  tagFlow(appName, flowName, tag) {
    if (tag && this.tags[tag]) {
      this.taggedFlows.tagFlow(appName, flowName, tag);
    }
  }

  untagFlow(appName, flowName, tag) {
    if (tag && this.tags[tag]) {
      this.taggedFlows.untagFlow(appName, flowName, tag);
    }
  }
  _populateTags = () => {
    fs.readFile(this.tagFilePath, "utf8")
      .then((data) => {
        return JSON.parse(data);
      })
      .catch((err) => {
        return {};
      })
      .then(({ tags, taggedFlows }) => {
        this.tags = tags || {};
        this.taggedFlows = new TaggedFlows(taggedFlows);
      });
  };
  save() {
    let fileContent = JSON.stringify({
      tags: this.tags,
      taggedFlows: this.taggedFlows.flows,
    });
    return fs.writeFile(this.tagFilePath, fileContent).catch((err) => {
      return {
        error: `Unable to save tags to ${this.tagFilePath}`,
      };
    });
  }
}

function TaggedFlows(flows = {}) {
  this.flows = flows;
  this.getTagsForFlow = (appName, flowName) => {
    return this.flows[appName] && this.flows[appName][flowName]
      ? this.flows[appName][flowName]
      : [];
  };
  this.tagFlow = (appName, flowName, tag) => {
    if (!this.flows[appName]) {
      this.flows[appName] = { flowName: [tag] };
    } else {
      if (!this.flows[appName][flowName]) {
        this.flows[appName][flowName] = [tag];
      } else {
        this.flows[appName][flowName].push(tag);
      }
    }
  };

  this.untagFlow = (appName, flowName, tag) => {
    let appFlows = this.flows[appName];
    if (appFlows && appFlows[flowName]) {
      const index = appFlows[flowName].indexOf(tag);
      if (index > -1) {
        appFlows[flowName].splice(index, 1);
      }
      if (appFlows[flowName].length === 0) {
        delete appFlows[flowName];
      }
    }
  };
  this.untagAllFlows = (tag) => {
    Object.keys(this.flows).forEach((appName) => {
      Object.keys(this.flows[appName]).forEach((flowName) => {
        this.untagFlow(appName, flowName, tag);
      });
    });
  };
}
module.exports = TagManager;
