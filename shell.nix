{ mkShell
, nodejs
, tree-sitter
, zsh
}:

let
  name = "tree-sitter";

in
mkShell {
  inherit name;

  packages = [
    tree-sitter
    nodejs
  ];

  shellHook = ''
    export NIX_SHELL_NAME="${name}"
    RPROMPT='%F{magenta}${name}%f %1(j.«%j» .)%*'
    ${zsh}/bin/zsh
    exit 0
  '';
}
