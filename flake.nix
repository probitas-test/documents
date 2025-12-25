{
  description = "Development environment for probitas-test/documents";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    probitas.url = "github:probitas-test/cli";
    probitas.inputs.nixpkgs.follows = "nixpkgs";
    probitas.inputs.flake-utils.follows = "flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, probitas }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        probitasPkg = probitas.packages.${system}.probitas;
      in {
        packages.default = probitasPkg;

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.deno
            pkgs.pagefind
            probitasPkg
          ];

          shellHook = ''
            export DENO_NO_UPDATE_CHECK=1
          '';
        };
      });
}
