{
  description = "Development environment for probitas-test/documents";

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
          packages = with pkgs; [
            deno
            pagefind
            probitas
          ];

          shellHook = ''
            export DENO_NO_UPDATE_CHECK=1
          '';
        };
      });
}
