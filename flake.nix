{
  # Thank you, https://github.com/loophp/rust-shell! Most of this is a copy of it.
  description = "A Rust development shell";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };
  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      perSystem =
        {
          system,
          ...
        }:
        let
          pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ (import inputs.rust-overlay) ];
          };
          makeRustInfo =
            {
              version,
              profile,
            }:
            let
              rust = pkgs.rust-bin.${version}.latest.${profile}.override { extensions = [ "rust-src" ]; };
            in
            {
              name = "rust-" + version + "-" + profile;
              path = "${rust}/lib/rustlib/src/rust/library";
              rust = (
                pkgs.rust-bin.stable.latest.default.override {
                  extensions = [ "rust-src" ];
                  targets = [ "wasm32-unknown-unknown" ];
                }
              );
              drvs = with pkgs; [
                pkg-config
                cargo
                # cargo-watch
                cargo-tauri
                # Below cause RustRover commit window to break and direnv not to load environment vars
                gobject-introspection
                at-spi2-atk
                gtk3
                webkitgtk_4_1
                # Above cause RustRover commit window to break and direnv not to load environment vars
                atkmm
                cairo
                gdk-pixbuf
                glib
                gsettings-desktop-schemas
                harfbuzz
                librsvg
                libsoup_3
                pango
                # openssl
                nodejs
                typescript-language-server
                pnpm
                wasm-pack
                llvmPackages.bintools
                rust
                rust-analyzer
                gcc
              ];
            };
          matrix = {
            stable-default = {
              version = "stable";
              profile = "default";
            };
            nightly-default = {
              version = "nightly";
              profile = "default";
            };
          };
        in
        {
          formatter = pkgs.alejandra;
          devShells =
            builtins.mapAttrs (
              name: value:
              let
                version = value.version;
                profile = value.profile;
                rustInfo = makeRustInfo {
                  inherit version profile;
                };
              in
              pkgs.mkShell {
                name = rustInfo.name;
                RUST_SRC_PATH = rustInfo.path;
                buildInputs = rustInfo.drvs;
              }
            ) matrix
            // {
              default =
                let
                  version = matrix.stable-default.version;
                  profile = matrix.stable-default.profile;
                  rustInfo = makeRustInfo {
                    inherit version profile;
                  };
                in
                pkgs.mkShell {
                  name = rustInfo.name;
                  RUST_SRC_PATH = rustInfo.path;
                  WEBKIT_DISABLE_COMPOSITING_MODE = "1";
                  WEBKIT_DISABLE_DMABUF_RENDERER = "1";
                  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath rustInfo.drvs;
                  buildInputs = rustInfo.drvs;
                  shellHook = ''
                    export CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG=true
                    export PATH=$PATH:''${CARGO_HOME:-~/.cargo}/bin
                    export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
                    echo ""
                    echo "Welcome to your Rust WASM environment!" | ${pkgs.lolcat}/bin/lolcat
                    echo "It uses Rust ${version} with $(rustc --version), includes Tauri, and the WASM target." | ${pkgs.lolcat}/bin/lolcat
                    echo ""
                  '';
                };
            };
        };
    };
}
