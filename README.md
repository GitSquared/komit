# 👮 Komit
![npm badge](https://badgen.net/npm/v/komit)

Komit is a small prompt designed to be run as a git hook to help follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) message standard.

Komit doesn't try to get in your way, and assumes you only need help writing the header part of the commit. It lets git open your favorite editor to change the body & footer of your message before commiting.

It also helps maintaining a consistent list of commit scopes by syncing a `.commitscopesrc` file in your repository.

## Demo

![Komit demo](https://raw.githubusercontent.com/GitSquared/komit/master/readme_src/demo.gif)

## Installation with [Husky](https://github.com/typicode/husky)

Install the package:
```
npm i -D komit
```

Add the hook to your package.json:
```json
"husky": {
  "hooks": {
    "prepare-commit-msg": "komit $HUSKY_GIT_PARAMS"
  }
},
```

## Installation with traditional git hooks

Add to `.git/hooks/prepare-commit-msg`:
```sh
#!/bin/sh

npx komit .git/COMMIT_EDITMSG
```

## Credits
Built with the amazing [enquirer](https://github.com/enquirer/enquirer) lib. Thanks to @dosentmatter for [force-stdin-tty](https://github.com/dosentmatter/force-stdin-tty) which fixed stdin access problems when running as a Husky hook.

Written by [Gaby](https://gaby.dev), a software architect based in Paris.

## License
[MIT](https://github.com/GitSquared/komit/blob/master/LICENSE)
