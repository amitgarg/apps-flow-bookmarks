# Appwise Code Navigator

## About
- Appwise Code Navigator is a VS Code extension that provides bookmarking and visual diagram generation for code flows. 

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

- `codeNavigator.diagramsDir`
to configure the directory where the diagrams will be saved. The default value is `docs/flows`

- `codeNavigator.appsDir`
to configure the directory where the apps are located. The default value is `packages/apps`

- `codeNavigator.projectName`
to configure the project name. The default value is `teams-modular-packages`

### Commands contributed to Command Palette

- `ACN: Load Bookmarks from an App`
sets the selected app as active and loads bookmarks from that app.

- `ACN: Initialize Bookmarks for an App`
initializes bookmarks for an app.

- `ACN: Save Bookmarks for App`
saves bookmarks for the active app. It will save the bookmarks in the `{appsDir}/{apps-name}/multiColorBookmarks.json` file.

- `ACN: Manage Joined Flows for an App`
manages joined flows for an app. It will open the `{appsDir}/{apps-name}/joinedBookmarks.json` file in editor.

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
- `FLOW-WISE BOOKMARKS` (Contributed by [MCB](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark))
    - list flows bookmarked for the active app
    - click on the bookmark to open the respective file/line in editor 
    - remove the bookmark for a flow by clicking on the remove icon
    - edit
        - edit bookmark name
        - move bookmark to other flow by editing flow name
        - change bookmark order by editing indexing
    - Save all bookmarks for current app

- `ALL FLOWS`
    - Lists all Basic and Joined flows
    - Reload Both types of flows for the app again (affects all views)
    - Search flows in the app with  (matches any of below)
        - text
        - app name (for joined flows)
    - Copy JSON snippet for a flow ( these snippets can be used to configure joined flows in joinedBookmarks.json)
    - Generate Git Graph diagram of the flow
        - saves the diagram as `{diagramsDir}/{apps-name}/{flow-type}-{flow-name}.md`
        - opens the diagram in editor
        - can be previewed using any MarkDown previewer which supports `mermaid` diagrams
    - Show all Bookmarks for a flow (Will be rendered in `FLOW BOOKMARKS` view)

- `FLOW BOOKMARKS`
    - Lists all bookmarks for a flow selected in `ALL FLOWS` view
    - Highlight the @tag and #tag in bookmark name
    - Search all bookmarks with a keyword
       - file name
        - text or any tags in bookmark name (any @tag OR #tag which can be agreed on team level) 
    - Clicking on a bookmark will open the file at specific line in editor

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