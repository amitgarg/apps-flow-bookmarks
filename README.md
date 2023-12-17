# Appwise Code Flows Navigator

## About

- **Appwise Code Flows Navigator** is a VS Code extension that provides bookmarking, visual diagram generation for code flows. It also provides support to run unit test cases during development of a flow.

- Since every project is designed around apps (Independent resource, service, UI area).
  This extesion provides functionalities to manage bookmarks specific to Apps.

- At at time only 1 App remains active for bookmarking. You can switch between apps using the `ACN:Load Bookmarks from an App` command.

- There are 2 types of flows supported

  - **Basic Flows** : flows specific to the app (saved in `{appsDir}/{apps-name}/multiColorBookmarks.json`)
  - **Joined Flows**: flows created by joining multiple flows across apps (saved in `{appsDir}/{apps-name}/joinedBookmarks.json`). This make even the flows reusable.

- Both of these above file types should be checked-in to repo, to share the bookmarks in the team.

- This extension works along with the [Multi Color Bookmarks FlowWise (MCB) ](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark) extension, which handles
  - [Create Bookmarks](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark#add-a-quick-bookmark)
  - [Edit Bookmarks](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark#edit-a-bookmark-or-flow)
  - [Delete Bookmarks](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark#clear-a-bookmark)

## Features

### Settings

- `codeNavigator.projectName`
  to configure the project name. The default value is `teams-modular-packages`

- `codeNavigator.tagsDir`
  to configure the directory where the tags file is located. The default value is `.vscode`

- `codeNavigator.appsDir`
  to configure the directory where the apps are located. The default value is `packages/apps`. Set the value as empty string if you just want to create custom app names.
   
- `codeNavigator.enableCustomAppNames`
  to configure whether to allow user to enter custom app names. The default value is false

- `codeNavigator.metaDir`
  to configure the directory where the bookmarks will be saved in the respective folder of app name. The default value is `packages/apps`  

- `codeNavigator.diagramsDir`
  to configure the directory where the diagrams will be saved. The default value is `docs/flows`

- `codeNavigator.diagramsType`
  to configure the type of diagrams to be generated. The default value is `gitgraph`. Current supported types are

  - `gitgraph` : generates git graph diagrams
  - `sequence` : generates sequence diagrams

- `codeNavigator.showLineNumbers`
  to configure whether to show line numbers in the diagrams. The default value is true

- `codeNavigator.testRunCommand`
  to configure Command to run tests, `${path:name:ext}` variable will be replaced with space separated list of file paths. The default value is `yarn test:unit ${path:name}`.

  - File path to be used in command can be configured using below variables. All file paths will be space separated:
    - `${path:name:ext}`: complete path of file with extension
    - `${path:name}` : complete path of file without extension
    - `${path}` : complete path of parent directory of file
    - `${name:ext}` : file name with extension
    - `${name}` : file name without extension

- `codeNavigator.testRunCoverageCommand`
  to configure Command to run tests with coverage, `${path:name}` variable will be replaced with space separated list of file paths. The default value is `yarn test:unit:coverage ${path:name}`. File path can be configured in similar manner as `codeNavigator.testRunCommand`

### Commands contributed to Command Palette

- `ACN: Load Bookmarks from an App`
  sets the selected app as active and loads bookmarks from that app.

- `ACN: Initialize Bookmarks for an App`
  initializes bookmarks for an app.

- `ACN: Save Bookmarks for App`
  saves bookmarks for the active app. It will save the bookmarks in the `{appsDir}/{apps-name}/multiColorBookmarks.json` file.

- `ACN: Manage Joined Flows for an App`
  manages joined flows for an app. It will open the `{appsDir}/{apps-name}/joinedBookmarks.json` file in editor.

- `ACN: Manage Tags`
  manages tags for the project. All the tags are stored in `{tagsDir}/bookmarkTags.json` file. You may add/edit/remove tags by selecting appropriate option. on edit/remove tag, all the bookmarks with that tag will be updated.

- `ACN: Search Flows Across Apps with keywords`
  This command searches flows across apps with keywords. It opens the Search Panel, user can see which all apps are listed in the search results.

  - User can load the bookmarks for the app and again search in flows specific to that app.
  - The space separated keywords are coverted to OR query. (keyword1)|(keyword2)
  - Supported Keywords.
    - file name
    - text or any tags in flow name (any tags which can be agreed on team level)
    - app name (in joined flows as well)

- `ACN: Reset`
  This command drops all in-memory flows and bookmarks, and loads all flows again from file system. It is recommended to run this command when
  - user switches to other branch which might have different flows
  - user changes extension settings which might affect the flow files location

### Views Contributed

- `FLOW-WISE BOOKMARKS`

  - About
    - Contributed by [MCB](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark)
    - lists flows and respective bookmarks for the active app
    - This is edit area for all flows and bookmarks related to the app, needs to save before all changes are reflected in other views
  - View
    ![Flowwise Bookmarks View](./images/flowwise%20bookmarks.jpg)
  - Actions
    - Common
      - Save all bookmarks for current app (manadatory to reflect current data in all other views)
      - Reset all changes
    - Flow
      - Rename
      - Rearrange all bookmarks for the flow (sorts bookmarks in the index order and assigns new index to each bookmark)
    - Bookmark
      - Edit
        - Rename
        - move bookmark to other index within same flow
        - move bookmark to other flow by editing flow name
      - Move the bookmark to other index within same flow
      - Remove the bookmark by clicking on the remove icon
      - Click: Open the respective file/line in editor

- `ALL FLOWS`
  - About
    - Lists all Basic and Joined flows
    - highlights the tags for each flow
  - View
    ![All Flows View](./images/all%20flows.png)
  - Actions
    - Common
      - Search flows in the app with (matches any of below)
        - text
        - app name (for joined flows)
      - Manage project wide tags
        - add new tag
        - edit tag
        - remove tag
      - Reload Both types of flows for the app again (affects all views)
    - Joined Flow Category
      - Manage joined flows for the app
    - Flow
      - Copy JSON snippet ( these snippets can be used to configure joined flows in joinedBookmarks.json)
      - Export diagram of the flow
        - generates the diagram of type based on the `codeNavigator.diagramsType` setting
        - saves the diagram as `{diagramsDir}/{apps-name}/{flow-type}-{flow-name}.md`
        - opens the diagram in editor
        - can be previewed using any MarkDown previewer which supports `mermaid` diagrams
      - Manage tags (of format @tag or #tag)
        - add tags
        - remove tags
      - Render flow bookmarks and files(affects `FLOW BOOKMARKS` and `FLOW FILES` views)
      - Click: on joined flow to show its sub flows in tree
- `FLOW BOOKMARKS`

  - About - Lists all bookmarks for a flow selected in `ALL FLOWS` view - Highlight the @tag and #tag in bookmark name
  - View
    ![Flow Bookmarks View](./images/flow%20bookmarks.png)
  - Actions
    - Common
      - Search all bookmarks with a keyword
        - file name
        - text or any tags in bookmark name (any @tag OR #tag which can be agreed on team level)
    - Bookmark
      - Click: open the file at specific line in editor

- `FLOW FILES`
  - About
    - Lists all files involved in a flow selected in `ALL FLOWS` view
  - View
    ![Flow Files View](./images/flow%20files.jpg)
  - Actions
    - Flow
      - Run test cases for all files involved in the flow
    - File
      - Run Test cases for a source file
      - Run Test with Coverage for a source file
      - Click: Open the file in editor

### Status Bar Items

- `Bookmark Bar`
![Status Bar Item](./images/status%20bar.png)
  - show bookmark icon and status text in status bar on the left side, 3 type of status
    - PATH_ERROR : when the path to any file in config is not correct
    - READY: when all the paths are correct
    - {app-name} : when the bookmarks are loaded for an app
  - on click calls the command `ACN: Reset`

## Problems currently faced by Devs

### Onboarding to code

- Complex code with many layers (commanding, App, Component, Renderers, Apollo, Resolvers, MVVM, services, providers, HOCs, etc)
- Dead Code (due to migrations)
- Multiple versions
- copilot is limited to help in single file
- Dependency on other Devs for KT
  - Devs are busy which delays the KT
  - Consumes productive time of both

### Delayed PRs reviews

- difficult to understand the Context
- If unaware of that App/UI area, can’t provide relevant feedback
- which all scenarios might be affected (can’t comment on scope of testing)
- Require lot of time investment to understand the changes, needs dedicated time

### Debugging

- Have to brush up the code flow every time unless I have super memory
- Code comments don’t communicate how classes interact with each other
- for critical issues same dev should debug

### Config changes

- Wiki is there but what exact files i need to make changes in
- Examples
  - add an exception in the lint rules
  - adds a new scenario in telemetry

### Dependency Risk

- Knowledge is scattered, Dependency on particular dev for debugging
- All the knowledge goes away when dev leaves team

## Problems Addressed by this extension

### Onboarding

- pickup a UI area and start going through all the flows created by person who has worked on those
- Visual diagrams state the flow in the form of story
- Reduces dependency on other devs for KT

### PR Reviews

- Write code to create/refactor/fix, create flows to educate the team
- share diagrams for visual understanding of the changes
- helps in quick and quality feedback
- Easy to estimate the scope of testing
- Help to get Helped

### Faster Development

- Can create a temperory flow for what all changes are needed where before starting to code
- Easy navigation in editor while working on a fix
- Minimizes distractions

### Faster Debugging

- Times saved in figuring out the code
- Handy list of debugging points for each user flow
- Easier RCA based on files involved in the flow
  - Easier to pull out changes in all related files from git history

### Config Changes

- checklist is handy

### Dependency

- Everyone can have overview of any part of UI and can contribute to debugging when needed

## Added Benefits

- Visual Documentation in form of markdown files (Pics in the form of text)
- Easy to share and acquire the knowledge, promotes
  - sharing culture
  - learning culture
- May provide data points to be fed to an AI system
  - contextual understanding, git history access provides
    - development support
    - better debugging support
  - running selected e2e test cases automatically in case of regressions and bugs

## Limitations

- Bookmarks may not remain at exact line position with merges happening

## Next?

- Support tagging of flows
- Support adding notes for flows
- Look at other possibilities of usage of this metadata
- Mandate publishing flow for any PR
- Perf improvement of the extension
