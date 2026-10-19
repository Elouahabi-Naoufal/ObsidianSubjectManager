<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT TITLE BLOCK -->
<br />
<div align="center">
  <a href="https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager">
    <h3 align="center">Subject Manager</h3>
  </a>

  <p align="center">
    Academic subject management for Obsidian: subjects, assignments, exams, projects, todos and absences,
    with search, analytics and note templates.
    <br />
    <a href="https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager"><strong>Explore the source »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Subject Manager is an Obsidian plugin for running a semester from inside the vault. It keeps subjects,
assignments, projects, exams, todos and absences in the plugin's data store, and puts a command-palette
interface, a dashboard, search, analytics and generated notes on top of that data.

What it provides:

* **Subjects** — name, code, professor, credits and an archived flag. One subject can be marked active;
  its code is shown in the status bar.
* **Assignments** — name, subject, due date and a completed toggle.
* **Projects** — name, subject, status, progress and a description.
* **Exams** — name, subject, date, time and room/location fields.
* **Todos** — a task, an optional subject and due date, and a completed toggle.
* **Absences** — date, subject, type and reason, with add/edit/delete and a list view.
* **Dashboard** — active subject cards with a **Switch To** button, plus the next five assignment
  deadlines.
* **Search** — case-insensitive substring search across subjects, assignments, projects, exams, todos and
  absences from one modal.
* **Analytics** — counts for active subjects, assignments, projects, upcoming exams, pending todos and
  absences, plus 30-day completion trends and deadlines for the next seven days.
* **Deadline notifications** — an hourly check that raises an Obsidian notice for assignments and exams due
  tomorrow or within the next week, and for todos due tomorrow.
* **Note templates** — generate a note inside the subject's vault folder (or one of its subfolders) from a
  template type. The picker lists many note types; 18 have dedicated templates (lecture, assignment,
  project, exam study guide, lab report, research, quick note, meeting, study session, essay,
  presentation, book notes, article summary, thesis chapter, case study, flashcards, cheat sheet, weekly
  review). Any other selection falls back to a quick note.
* **Subject folder convention** — generated notes are written under
  `<code padded to 2> - <SUBJECT NAME IN UPPERCASE>/`, creating the folder and any selected subfolder if
  they do not exist.

All plugin data is saved through Obsidian's `saveData()` into the plugin's `data.json`. There are no
network calls and no external services.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Obsidian][Obsidian.com]][Obsidian-url]
* [![JavaScript][JavaScript.com]][JavaScript-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Obsidian 0.15.0 or newer — the `minAppVersion` declared in `manifest.json`.
* No build step. `main.js` is the shipped source, written as a CommonJS module that requires the
  `obsidian` API. `styles.css` is optional and is included in this repository.

### Installation

**From a release**

1. Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub release.
2. Create `<vault>/.obsidian/plugins/subject-manager/`.
3. Copy the files into that folder.
4. Reload Obsidian, then enable **Subject Manager** under **Settings → Community plugins**.

**From source**

```sh
git clone https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager.git
cd ObsidianSubjectManager
```

Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/subject-manager/` and
reload Obsidian. `src/main.js` and `main.js` are currently identical. For development, symlink the clone
into the plugin folder so edits take effect after a reload.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Commands

| Command | What it does |
|---------|--------------|
| Open Dashboard | Subject cards and upcoming assignment deadlines |
| Create Template Note | Pick a template type, subject, note name and target folder |
| Switch Subject | Set the active subject and update the status bar |
| Search All Items | Search every entity type at once |
| View Analytics | Statistics, 30-day productivity and next-7-day deadlines |
| Manage Absences | List, add, edit and delete absences |
| Manage Subjects | Create, edit, archive and delete subjects |
| Manage Assignments | Create, edit and delete assignments |
| Manage Projects | Create, edit and delete projects |
| Manage Exams | Create, edit and delete exams |
| Manage Todos | Create, edit and delete todos |

The dashboard is also available from the graduation-cap ribbon icon.

### Suggested flow

1. Run **Manage Subjects** and create your courses. Fill in the code, professor and credits.
2. Open the dashboard and press **Switch To** on the course you are currently working on.
3. Add assignments, exams, projects and todos from their management commands.
4. Run **Create Template Note**, choose a type and a subject, and pick the subject folder or one of its
   subfolders. The note is created and opened.
5. Check **View Analytics** weekly for completion counts and the deadline list.

### Note naming

Generated notes use the subject code and the current date, for example
`ABC - Lecture 1 - 2026-10-19.md`. If you leave the note name blank, the template's default label is used.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

Working today:

- [x] Subjects, assignments, projects, exams, todos and absences with CRUD modals
- [x] Active subject and status-bar indicator
- [x] Dashboard with subject switching and upcoming deadlines
- [x] Cross-entity search
- [x] Analytics with counts, 30-day trends and a deadline list
- [x] Hourly deadline notifications through Obsidian notices
- [x] 18 dedicated note templates plus a quick-note fallback
- [x] Subject folder creation and optional subfolder targeting
- [x] Release workflow that attaches `main.js`, `manifest.json` and `styles.css`

Open items visible in the code:

- [ ] Next lecture and lab numbers are hard-coded to `1`; the helper does not inspect existing files yet
- [ ] The template picker lists more types than the switch implements; the rest silently become quick
      notes
- [ ] Notifications run on a one-hour interval and are not configurable
- [ ] No import/export of plugin data
- [ ] No automated tests
- [ ] `manifest.json` lists the author as `Naoufal` rather than the full name

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create.
Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You
can also simply open an issue with the tag "enhancement". Don't forget to give the project a star!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Test in a throwaway vault: copy the plugin files into `.obsidian/plugins/subject-manager/`, reload, and
exercise the command you touched. Because there is no build, edit `main.js` (and mirror the change in
`src/main.js` if you want to keep them identical), then reload Obsidian.

### Top contributors:

<a href="https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Elouahabi-Naoufal/ObsidianSubjectManager" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Naoufal Elouahabi - [LinkedIn](https://www.linkedin.com/in/elouahabi-naoufal/) - elouahabi-naoufal1@gmail.com

Project Link: [https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager](https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Obsidian](https://obsidian.md/) and the [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
* [Img Shields](https://shields.io)
* [Choose an Open Source License](https://choosealicense.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Elouahabi-Naoufal/ObsidianSubjectManager.svg?style=for-the-badge
[contributors-url]: https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Elouahabi-Naoufal/ObsidianSubjectManager.svg?style=for-the-badge
[forks-url]: https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/network/members
[stars-shield]: https://img.shields.io/github/stars/Elouahabi-Naoufal/ObsidianSubjectManager.svg?style=for-the-badge
[stars-url]: https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/stargazers
[issues-shield]: https://img.shields.io/github/issues/Elouahabi-Naoufal/ObsidianSubjectManager.svg?style=for-the-badge
[issues-url]: https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/issues
[license-shield]: https://img.shields.io/github/license/Elouahabi-Naoufal/ObsidianSubjectManager.svg?style=for-the-badge
[license-url]: https://github.com/Elouahabi-Naoufal/ObsidianSubjectManager/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/elouahabi-naoufal/
[Obsidian.com]: https://img.shields.io/badge/Obsidian-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white
[Obsidian-url]: https://obsidian.md/
[JavaScript.com]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
