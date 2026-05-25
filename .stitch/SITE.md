# Site Vision: Amora Clinical Clean-Tech

**Project ID:** 15120793825541029640
**Target Framework**: Plain HTML & Vanilla CSS with Tailwind CSS CDN.

## 1. Vision & Purpose
Amora is a modern platform designed for clinical research, biotech exploration, and education. The site features a unified experience containing the prompt-driven Builder, Events tracking, online Classes, Community forum, and user Settings.

## 2. Global Rules & Constraints
- Single navigation bar layout (Sidebar, width `w-64`).
- Support for Light Theme (white/gray) and Night Theme (brand assets dark theme).
- Theme toggling managed locally using the `.dark` class on the `<html>` root and saved in `localStorage`.
- Assets mapped to responsive dynamic URLs.

## 3. Sitemap & Page Status
- [x] Builder (`index.html`) - Main dashboard with prompt entry box and theme switcher.
- [ ] Eventos (`eventos.html`) - Schedule of upcoming biotech and clinical science events.
- [ ] Aulas (`aulas.html`) - Online lecture modules and video list.
- [ ] Comunidade (`comunidade.html`) - Feed of discussions and posts.
- [ ] Configuração (`configuracao.html`) - Settings page for user profile, plan, and options.
- [x] Blog (`app/blog`) - Blog page containing news, research updates, and articles.

## 4. Roadmap / Generation Backlog
1. Generate `eventos.html` with card list of clinical research seminars.
2. Generate `aulas.html` with playlist structure and progress metrics.
3. Generate `comunidade.html` with discussion feed and posts card deck.
4. Generate `configuracao.html` with user settings tabs.
5. Integrate Blog with next-gen layout.
