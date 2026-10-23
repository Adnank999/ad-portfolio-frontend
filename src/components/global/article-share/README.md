# Article sharing

`ArticleShare` copies the current origin and pathname, omitting filter parameters and section hashes. It announces successful copies and exposes a selectable link if clipboard access is unavailable. Browser APIs are used only in the click handler, so server rendering is safe.
