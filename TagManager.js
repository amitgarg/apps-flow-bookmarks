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
      this.tags[tag] = description || "";
    }
  }
  editTag(tag, newTag, description) {
    if(tag && newTag) {
      this.taggedFlows.retagAllFlows(tag, newTag);
      this.tags[newTag] = description || "";
      delete this.tags[tag];
    }
  }
  listTags() {
    return Object.keys(this.tags).map((tag) => {
      return { label: tag, description: this.tags[tag] };
    });
  }
  removeTag(tag) {
    if (tag) {
      delete this.tags[tag];
      this.taggedFlows.retagAllFlows(tag);
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
        this.taggedFlows = new TaggedFlows(taggedFlows || {});
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
    return (this.flows[appName] && this.flows[appName][flowName]) || [];
  };
  this.tagFlow = (appName, flowName, tag) => {
    if (!this.flows[appName]) {
      this.flows[appName] = { flowName: [tag] };
    } else if (!this.flows[appName][flowName]) {
      this.flows[appName][flowName] = [tag];
    } else {
      this.flows[appName][flowName].push(tag);
    }
  };
  this.untagFlow = (appName, flowName, tag) => {
    let appFlows = this.flows[appName];
    reTagFromApp(appFlows, flowName, tag);
  };
  this.retagAllFlows = (tag, newTag) => {
    Object.values(this.flows).forEach((appFlows) => {
      Object.keys(appFlows).forEach((flowName) => {
        reTagFromApp(appFlows, flowName, tag, newTag);
      });
    });
  };

  function reTagFromApp(appFlows, flowName, tag, newTag) {
    if (appFlows && appFlows[flowName]) {
      const index = appFlows[flowName].indexOf(tag);
      if (index > -1) {
        // remove old tag
        appFlows[flowName] = appFlows[flowName].splice(index, 1);
      }
      if(newTag){
        // add new tag if provided
        appFlows[flowName].push(newTag);
      }
      if (appFlows[flowName].length === 0) {
        delete appFlows[flowName];
      }
    }
  }
}
module.exports = TagManager;
