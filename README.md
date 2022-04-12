# trello-json-viewer

Web UI for reading Trello's JSON archives

To use:

1. Place your trello.json export in the same directory as index.html
2. Browse to index.html

Doing this from a local folder doesn't work in Chrome but does work in Firefox, otherwise host it through a server.

There are likely to be many issues, feel free to help or log issues.

To compile the CSS if you need to:

$ sass -m style.scss style.css

or if you have docker and don't want to install sass:

$ docker run --rm -v $(pwd):$(pwd) -w $(pwd) jbergknoff/sass -m style.scss style.css
