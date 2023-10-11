# Appwise Code Navigator

Appwise Code Navigator is a VS Code extension that provides bookmarking functionality for your user flows. This extension works along with the [Multi Color Bookmarks FlowWise (MCB) ](https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark) extension.

Since every code is designed around apps (Independent resource, service, UI area). This extesion provides functionalities to manage flowwise bookmarks specific to Apps. 

At at time only 1 App remains active for bookmarking. You can switch between apps using the `ACN:Load Bookmarks from an App` command.

There are 2 types of flows supported:
- Basic Flows : flows specific to the app (saved in `packages/apps/{apps-name}/multiColorBookmarks.json`)
- Joined Flows: flows created by joining multiple flows across apps (saved in `packages/apps/{apps-name}/joinedBookmarks.json`). This make even the flows reusable.

Both of these above file types should be checked-in to repo, to make sure that bookmarks are available to all developers.

## Features
### Commands contributed to Command Palette

- `ACN: Load Bookmarks from an App`
This command loads bookmarks from an app. To use this command, run the command directly.

- `ACN: Initialize Bookmarks for an App`
This command initializes bookmarks for an app. creates multiColorBookmarks.json in the respective *apps/{apps-name}* directory. To use this command, run the command directly.

- `ACN: Save Bookmarks for App`
This command saves bookmarks for the active app. To use this command, run the command directly.

- `ACN: Manage Joined Flows for an App`
This command manages joined flows for an app. To use this command, run the command directly. It will open the joinedBookmarks.json file in editor. User can add/remove joined flows from this file.


- `ACN: Search Flows Across Apps with keywords`
This command searches flows across apps with keywords. To use this command, run the command directly. This command opens the Search Panel, user can see which all apps are listed in the search results. User can load the bookmarks for the app and again search in flows specific to that app. 
The space separated keywords are coverted to OR query. (keyword1)|(keyword2)
Following type of keywords are supported. 
    - file name
    - text or any tags in flow name (any tags which can be agreed on team level)
    - app name (in joined flows as well)

- `ACN: Reset`
It is recommended to run this command when user switches to other branch which might have discrepency in flows. This command drops all in-memory flows and bookmarks, and loads all flows again from file system. To use this command, run the command directly.

### Views Contributed
- `FLOW-WISE BOOKMARKS` (Contributed by [MCB]((https://marketplace.visualstudio.com/items?itemName=DeepakPahawa.flowbookmark)))
    - shows the list of flows bookmarked for the active app
    - click on the bookmark  to open the flow in editor 
    - remove the bookmark for a flow by clicking on the remove icon
    - Edit
        - edit bookmark name
        - move bookmark to other flow by editing flow name
        - change bookmark order by editing indexing

- `ALL FLOWS`
    - Lists all Basic and Joined flows
    - Reload all flows from the app again (affects all views)
    - Search flows in the app with  (matches any of below)
        - text or any tags in flow name (any tags which can be agreed on team level)
        - app name (for joined flows)
    - Copy JSON snippet for a flow ( these snippets can be used to configure joined flows in joinedBookmarks.json)
    - Generate Git Graph diagram of the flow
        - saves the diagram as `/docs/flows/{apps-name}/{flow-type}-{flow-name}.md`
        - opens the diagram in editor
        - can be previewed using any MarkDown previewer which supports `mermaid` diagrams
    - View all Bookmarks for a flow (Will be rendered in `FLOW BOOKMARKS` view)

- `FLOW BOOKMARKS`
    - Lists all bookmarks for a flow selected in `ALL FLOWS` view
    - Search all bookmarks with a keyword
       - file name
        - text or any tags in bookmark name (any tags which can be agreed on team level) 
    - Clicking on a bookmark will open the file at specific line in editor

## Problems currently faced by Devs

### Onboarding to code
  - Complex code with many layers (commanding, App, Component, Renderers, Apollo, Resolvers, MVVM, services, providers, HOCs, etc)
  - HOCs (difficult to understand what data comes from where)
  - Dead Code (due to migrations)
  - Multiple versions
### Delayed PRs reviews
  - difficult to understand the Context
  - If unaware of that UI area, can’t provide relevant feedback
  - what kind of scenarios might be affected (can’t comment on scope of testing)
  - Require lot of time investment to understand the changes, needs dedicated time
### Debugging
  - Have to figure out the code every time unless I have super memory
  - Code comments don’t communicate how classes interact with each other
  - duplication of efforts
### Config changes
  - Wiki is there but what exact files i need to make changes in
  - Examples
    - add an exception in the lint rules
    - adds a new scenario in telemetry
### Dependency Risk
  - Knowledge is scattered, Dependency on particular dev for debugging

## Problems Addressed by this extension
### Onboarding
  - pickup a UI area and start going through all the flows created by person who has worked on those
  - Visual diagrams state the flow in the form of story
  - makes it easier to get overview of the code, details can be covered when needed
  - Understanding of various independent, reusable pieces like providers, HOCs etc in detail
### PR Reviews
  - Write code to create/refactor/fix, create flows to educate the team
  - share diagrams for visual understanding of the changes
  - helps in quick and quality feedback
  - Easy to estimate the scope of testing
  - Help to get Helped
### Faster Development
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
  - Everyone can have overview of any part of UI and can debug when needed

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
  - Make the directories for apps, docs configurable
  - Look at other possibilities of usage of this metadata
  - Mandate publishing flow for any PR
  - Perf improvement of the extension

This Extension has been developed by [Amit Kumar Garg(amitgarg)](mailto:amitdream2000@gmail.com)