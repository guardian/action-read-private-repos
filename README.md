# actions-read-private-repos

**This is largely a modified version of https://github.com/webfactory/ssh-agent,
converted to Typescript and simplified slightly.**

A Github Action to enable SSH read access to private Guardian repositories from
Github Actions running in another repository.

Access is provided via SSH using Github's [Deploy
Keys](https://docs.github.com/en/developers/overview/managing-deploy-keys)
feature.

Both NPM and SBT support resolving Github dependencies via SSH.

## Usage

```
uses: guardian/actions-read-private-repos@v0.1.0
with:
  private-ssh-keys: |
    [SSH secret key]
    [...]
```

For example, this might look like:

```
uses: guardian/actions-read-private-repos@v0.1.0
with:
  private-ssh-keys: ${{ secrets.PRIVATE_INFRASTRUCTURE_CONFIG_DEPLOY_KEY }}
```

Typically, there is an organisational secret already present for the supported
private repositories, but you can use a regular secret here too.

**You should not include the private key in plain text.**

## Adding a new private repository

To add support for a new repository:

**1. Generate a suitable SSH Key**

Firstly, create the key. E.g.

    $ ssh-keygen -t ed25519 -C "git@github.com:guardian/target-repo.git"

Note, the key **MUST**:

- contain the target repo as a comment (note the `-C` argument above)
- be `ed25519` rather than `rsa`
- not be passphrase protected

**2. Add the public part of the SSH key as a Deploy Key**

Github describes how to do this
[here](https://docs.github.com/en/developers/overview/managing-deploy-keys#setup-2).

**3. Add the private part of the SSH key as a secret**

Typically this means as a secret in the calling repository. But if many
repositories/teams are expected to depend on the target, it may be worth adding
as an Organisation Secret.

The recommended secret naming convention is:

    REPO_NAME_DEPLOY_KEY

where the repo name is capitalised, and hyphens or other special characters are
replaced with underscores.

## Development and testing

**Remember to run `npm run build` after TS changes to update the JS code.**

There is a 'test' workflow for this repository to test itself. It relies on
https://github.com/guardian/test-private-repository/.

## With thanks

This action is heavily inspired by https://github.com/webfactory/ssh-agent and
the core logic is a light translation of the original code into Typescript. As
such, some of the code is likely to be under the original copyright. The license
is included below:

MIT License

Copyright (c) 2019 webfactory GmbH <info@webfactory.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
