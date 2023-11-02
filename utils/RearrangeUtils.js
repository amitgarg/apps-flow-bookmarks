const fs = require("fs").promises;

function updateIndexes(flowName, filePath, onlyRearrange, fromIndex, toIndex) {
  // Load and parse the JSON file
  return fs
    .readFile(filePath, "utf8")
    .then(JSON.parse)
    .then((data) => {
      let instances = [];
      // Iterate over each file in the data
      for (const file in data) {
        // Iterate over each line in the file
        for (const line in data[file]) {
          // Check if the flow name matches
          if (data[file][line][1] === flowName) {
            instances.push({ file, line, index: data[file][line][2] });
          }
        }
      }
      function updateIndex(file, line, index) {
        data[file][line][2] = index;
      }
      sortedInstances = instances.sort((a, b) => a.index - b.index);
      if (onlyRearrange) {
        sortedInstances.forEach((instance, index) => {
          updateIndex(instance.file, instance.line, index);
        });
      } else {
        let shiftBlockDown = fromIndex > toIndex;
        let startIndex = !shiftBlockDown ? fromIndex : toIndex;
        let endIndex = !shiftBlockDown ? toIndex : fromIndex;
        let isOutOFBoundary = (index) => index < startIndex || index > endIndex;

        // if (fromIndex <= toIndex) {
        sortedInstances.forEach((instance, index) => {
          if (isOutOFBoundary(index)) {
            updateIndex(instance.file, instance.line, index);
          } else if (index == fromIndex) {
            updateIndex(instance.file, instance.line, toIndex);
          } else {
            updateIndex(
              instance.file,
              instance.line,
              shiftBlockDown ? index + 1 : index - 1
            );
          }
        });
      }
      return data;
    })
    .then((data) => {
      return fs.writeFile(filePath, JSON.stringify(data, null, 2));
    });
  // Stringify and write the updated data back to the JSON file
}
function moveBookmark(flowName, fromIndex, toIndex, filePath, bookmarks) {
  // TODO calculate which all indexes need to be updated
  let noOfBookmarks = 0;
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i]) {
      if (bookmarks[i].index === fromIndex) {
        fromIndex = noOfBookmarks;
      }
      noOfBookmarks++;
    }
  }
  if (
    fromIndex < -1 ||
    fromIndex >= noOfBookmarks ||
    toIndex < -1 ||
    toIndex >= noOfBookmarks
  ) {
    throw new Error("Invalid index");
  }
  return updateIndexes(flowName, filePath, false, fromIndex, toIndex);
}
function rearrangeBookmarks(flowName, filePath) {
  return updateIndexes(flowName, filePath, true);
}
exports.moveBookmark = moveBookmark;
exports.rearrangeBookmarks = rearrangeBookmarks;
