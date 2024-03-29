{
  description = "Tree-sitter grammar for alloy";

  outputs = { self, nixpkgs, ... }:
    let
      inherit (nixpkgs) lib;
      foldMap = f:
        builtins.foldl' (acc: x: lib.recursiveUpdate acc (f x)) { };

    in
    lib.flip foldMap [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ]
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          packages.${system}.devShell = pkgs.callPackage ./shell.nix {
            nodejs = pkgs.nodejs_latest;
          };

          devShells.${system}.default = self.packages.${system}.devShell;
        }
      );
}
