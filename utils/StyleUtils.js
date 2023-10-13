function getHighlights(description) {
    const highlights = [];
    if (description.includes("@") || description.includes("#")) {
      const regex = /(@|#)(\w+)/g;
      let match;
      while ((match = regex.exec(description))) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        highlights.push([startIndex, endIndex]);
      }
    }
    return highlights;
  }
  exports.getHighlights = getHighlights;