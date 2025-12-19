# Installation

This guide covers all methods to install Probitas CLI.

## Shell Installer

Requires [Deno](https://deno.land/) v2.x or later.

Install the CLI using the shell installer:

```bash
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | bash
```

### Options

Configure installation via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_VERSION=0.7.3 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

## Homebrew (macOS/Linux)

Install via the official Homebrew tap:

```bash
# Add the tap and install
brew tap jsr-probitas/tap
brew install probitas

# Or install directly
brew install jsr-probitas/tap/probitas
```

## Nix

The Probitas CLI provides a Nix flake with multiple usage patterns.

### Run Without Installing

Execute `probitas` directly without installing:

```bash
nix run github:jsr-probitas/cli
```

### Install to Profile

Install into your Nix profile for persistent access:

```bash
nix profile install github:jsr-probitas/cli
```

### Add to Project's flake.nix

Add Probitas to your project's development environment using the overlay:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    probitas.url = "github:jsr-probitas/cli";
    probitas.inputs.nixpkgs.follows = "nixpkgs";
    probitas.inputs.flake-utils.follows = "flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, probitas }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ probitas.overlays.default ];
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            probitas
          ];
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
overlays = [ probitas.overlays.default ];
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
probitas.inputs.nixpkgs.follows = "nixpkgs";
probitas.inputs.flake-utils.follows = "flake-utils";
```

Benefits:

- **Single nixpkgs version**: All dependencies share one nixpkgs, reducing
  closure size
- **Faster evaluation**: Fewer inputs to fetch and evaluate

### Pin a Specific Version

Lock to a specific CLI version using a commit hash or tag:

```nix
probitas.url = "github:jsr-probitas/cli/v0.7.3";
```

Or using a commit:

```nix
probitas.url = "github:jsr-probitas/cli/abc1234";
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

## Verify Installation

After installation, verify the CLI is working:

```bash
probitas --version
```

## Next Steps

- [Quick Start](/docs/overview/#quick-start) - Initialize your first project
- [Scenario Guide](/docs/scenario/) - Learn to write scenarios
