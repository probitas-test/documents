# Installation

This guide covers all methods to install Probitas CLI.

## Shell Installer

Requires [Deno](https://deno.land/) v2.x or later.

Install the CLI using the shell installer:

```bash
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | bash
```

### Options

Configure installation via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_VERSION=0.7.1 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

## Homebrew (macOS/Linux)

Install via the official Homebrew tap:

```bash
# Add the tap and install
brew tap probitas-test/tap
brew install probitas

# Or install directly
brew install probitas-test/tap/probitas
```

## Nix

The Probitas CLI provides a Nix flake with multiple usage patterns.

### Run Without Installing

Execute `probitas` directly without installing:

```bash
nix run github:probitas-test/probitas
```

### Install to Profile

Install into your Nix profile for persistent access:

```bash
nix profile install github:probitas-test/probitas
```

### Add to Project's flake.nix

Add Probitas to your project's development environment using the overlay:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    probitas-flake.url = "github:probitas-test/probitas";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, probitas-flake, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ probitas-flake.overlays.default ];
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [ probitas ];
        };
      });
}
```

Enter the development environment:

```bash
nix develop
```

### Why Use Overlays?

The overlay pattern integrates `probitas` directly into your `pkgs`, enabling
cleaner configuration:

```nix
overlays = [ probitas-flake.overlays.default ];
# ...
packages = with pkgs; [ probitas ];  # probitas is now part of pkgs
```

Benefits:

- **Unified namespace**: Access `probitas` like any nixpkgs package
- **Composable**: Combine with other overlays seamlessly

### Why Use inputs.follows?

The `inputs.follows` directive ensures Probitas uses your project's nixpkgs
version instead of its own pinned version:

```nix
probitas-flake.inputs.nixpkgs.follows = "nixpkgs";
probitas-flake.inputs.flake-utils.follows = "flake-utils";
```

Benefits:

- **Single nixpkgs version**: All dependencies share one nixpkgs, reducing
  closure size
- **Faster evaluation**: Fewer inputs to fetch and evaluate

### Pin a Specific Version

Lock to a specific CLI version using a commit hash or tag:

```nix
probitas-flake.url = "github:probitas-test/probitas/v0.7.1";
```

Or using a commit:

```nix
probitas-flake.url = "github:probitas-test/probitas/abc1234";
```

### Flake Outputs Reference

The Probitas CLI flake provides:

| Output                        | Description                       |
| ----------------------------- | --------------------------------- |
| `overlays.default`            | Overlay adding `probitas` to pkgs |
| `packages.${system}.default`  | The `probitas` CLI package        |
| `packages.${system}.probitas` | Alias for the CLI package         |
| `apps.${system}.default`      | App for `nix run`                 |
| `devShells.${system}.default` | Development shell                 |

## GitHub Actions

### Using setup-probitas Action

The recommended way to use Probitas in GitHub Actions:

```yaml
- uses: probitas-test/setup-probitas@v1
  with:
    version: latest # or specific version like '0.7.1'

- name: Run scenarios
  run: probitas run
```

See
[probitas-test/setup-probitas](https://github.com/probitas-test/setup-probitas)
for full documentation.

### Using Nix in GitHub Actions

For projects using Nix flakes with
[nixbuild/nix-quick-install-action](https://github.com/nixbuild/nix-quick-install-action):

```yaml
- uses: nixbuild/nix-quick-install-action@v34

- name: Run scenarios
  run: nix run github:probitas-test/probitas -- run
```

Or within a Nix development shell:

```yaml
- uses: nixbuild/nix-quick-install-action@v34

- name: Run scenarios
  run: nix develop -c probitas run
```

## Verify Installation

After installation, verify the CLI is working:

```bash
probitas --version
```

## Next Steps

- [Quick Start](/docs/overview/#quick-start) - Initialize your first project
- [Scenario Guide](/docs/scenario/) - Learn to write scenarios
