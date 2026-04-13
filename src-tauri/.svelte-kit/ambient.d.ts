
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SHELL: string;
	export const npm_command: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const PKG_CONFIG_FOR_TARGET: string;
	export const ZLE_RPROMPT_INDENT: string;
	export const __ETC_PROFILE_DONE: string;
	export const OBJDUMP_FOR_TARGET: string;
	export const __HM_SESS_VARS_SOURCED: string;
	export const COLORTERM: string;
	export const HYPRLAND_CMD: string;
	export const XDG_CONFIG_DIRS: string;
	export const NIX_LD_LIBRARY_PATH: string;
	export const NIX_BUILD_CORES: string;
	export const TERM_PROGRAM_VERSION: string;
	export const WLR_NO_HARDWARE_CURSORS: string;
	export const configureFlags: string;
	export const XDG_BACKEND: string;
	export const mesonFlags: string;
	export const ZSH_CACHE_DIR: string;
	export const shell: string;
	export const SIZE_FOR_TARGET: string;
	export const depsHostHost: string;
	export const WEZTERM_CONFIG_DIR: string;
	export const NIX_PROJECT_FOLDER: string;
	export const LC_ADDRESS: string;
	export const AS_FOR_TARGET: string;
	export const LC_NAME: string;
	export const SSH_AUTH_SOCK: string;
	export const DIRENV_DIR: string;
	export const npm_config_verify_deps_before_run: string;
	export const CC_FOR_TARGET: string;
	export const STRINGS: string;
	export const depsTargetTarget: string;
	export const LD_FOR_TARGET: string;
	export const XCURSOR_PATH: string;
	export const stdenv: string;
	export const LOCALE_ARCHIVE_2_27: string;
	export const PKG_CONFIG_PATH_FOR_TARGET: string;
	export const PYENV_VIRTUALENV_DISABLE_PROMPT: string;
	export const builder: string;
	export const WEZTERM_EXECUTABLE: string;
	export const LC_MONETARY: string;
	export const GDK_PIXBUF_MODULE_FILE: string;
	export const HL_INITIAL_WORKSPACE_TOKEN: string;
	export const shellHook: string;
	export const NO_AT_BRIDGE: string;
	export const NIX_BINTOOLS_FOR_TARGET: string;
	export const XCURSOR_SIZE: string;
	export const NIX_LDFLAGS_FOR_TARGET: string;
	export const DIRENV_FILE: string;
	export const EDITOR: string;
	export const phases: string;
	export const PMSPEC: string;
	export const FZF_ALT_C_OPTS: string;
	export const XDG_SEAT: string;
	export const PWD: string;
	export const NIX_PROFILES: string;
	export const SOURCE_DATE_EPOCH: string;
	export const LOGNAME: string;
	export const QT_QPA_PLATFORMTHEME: string;
	export const XDG_SESSION_TYPE: string;
	export const NIX_ENFORCE_NO_NATIVE: string;
	export const NIX_BINTOOLS_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
	export const CUPS_DATADIR: string;
	export const CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG: string;
	export const NIX_PATH: string;
	export const STRIP_FOR_TARGET: string;
	export const YAZI_CONFIG_HOME: string;
	export const NIXPKGS_CONFIG: string;
	export const RANLIB_FOR_TARGET: string;
	export const CXX: string;
	export const system: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const STRINGS_FOR_TARGET: string;
	export const POSH_SHELL: string;
	export const HOST_PATH: string;
	export const WINDRES_FOR_TARGET: string;
	export const NIX_PKG_CONFIG_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
	export const CLAUDECODE: string;
	export const QT_STYLE_OVERRIDE: string;
	export const GTK2_RC_FILES: string;
	export const IN_NIX_SHELL: string;
	export const GI_TYPELIB_PATH: string;
	export const doInstallCheck: string;
	export const HOME: string;
	export const NIX_BINTOOLS: string;
	export const GETTEXTDATADIRS: string;
	export const SSH_ASKPASS: string;
	export const LC_PAPER: string;
	export const LANG: string;
	export const NIXOS_OZONE_WL: string;
	export const WEZTERM_UNIX_SOCKET: string;
	export const LS_COLORS: string;
	export const _JAVA_AWT_WM_NONREPARENTING: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const depsTargetTargetPropagated: string;
	export const POSH_SHELL_VERSION: string;
	export const NH_FLAKE: string;
	export const POSH_SESSION_ID: string;
	export const WAYLAND_DISPLAY: string;
	export const cmakeFlags: string;
	export const SSL_CERT_DIR: string;
	export const WEBKIT_DISABLE_DMABUF_RENDERER: string;
	export const VIRTUAL_ENV_DISABLE_PROMPT: string;
	export const outputs: string;
	export const GIO_EXTRA_MODULES: string;
	export const OSTYPE: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const NIX_STORE: string;
	export const NIX_FOLDER: string;
	export const NIX_CFLAGS_COMPILE_FOR_TARGET: string;
	export const READELF_FOR_TARGET: string;
	export const LD: string;
	export const buildPhase: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const AR_FOR_TARGET: string;
	export const RUST_SRC_PATH: string;
	export const DIRENV_DIFF: string;
	export const READELF: string;
	export const GTK_A11Y: string;
	export const NIX_USER_PROFILE_DIR: string;
	export const INFOPATH: string;
	export const doCheck: string;
	export const depsBuildBuild: string;
	export const ZPFX: string;
	export const TERM: string;
	export const LC_IDENTIFICATION: string;
	export const DISABLE_INSTALLATION_CHECKS: string;
	export const GTK_PATH: string;
	export const SIZE: string;
	export const propagatedNativeBuildInputs: string;
	export const ZDOTDIR: string;
	export const strictDeps: string;
	export const USER: string;
	export const NIX_CC_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
	export const TZDIR: string;
	export const NIX_LD: string;
	export const FZF_CTRL_T_OPTS: string;
	export const AR: string;
	export const AS: string;
	export const HYPRLAND_INSTANCE_SIGNATURE: string;
	export const VISUAL: string;
	export const NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
	export const DISPLAY: string;
	export const SHLVL: string;
	export const MOZ_ENABLE_WAYLAND: string;
	export const CXX_FOR_TARGET: string;
	export const NM: string;
	export const GIT_EDITOR: string;
	export const __HM_ZSH_SESS_VARS_SOURCED: string;
	export const PAGER: string;
	export const NIX_CFLAGS_COMPILE: string;
	export const LC_TELEPHONE: string;
	export const QTWEBKIT_PLUGIN_PATH: string;
	export const patches: string;
	export const LC_MEASUREMENT: string;
	export const __NIXOS_SET_ENVIRONMENT_DONE: string;
	export const XDG_VTNR: string;
	export const buildInputs: string;
	export const XDG_SESSION_ID: string;
	export const preferLocalBuild: string;
	export const LOCALE_ARCHIVE: string;
	export const LESSKEYIN_SYSTEM: string;
	export const npm_config_user_agent: string;
	export const QML2_IMPORT_PATH: string;
	export const TERMINFO_DIRS: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const GSETTINGS_SCHEMAS_PATH: string;
	export const LD_LIBRARY_PATH: string;
	export const DISABLE_AUTOUPDATER: string;
	export const WEZTERM_CONFIG_FILE: string;
	export const XDG_RUNTIME_DIR: string;
	export const SSL_CERT_FILE: string;
	export const NM_FOR_TARGET: string;
	export const OBJCOPY_FOR_TARGET: string;
	export const NODE_PATH: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const depsBuildTarget: string;
	export const OBJCOPY: string;
	export const NIX_XDG_DESKTOP_PORTAL_DIR: string;
	export const out: string;
	export const LC_TIME: string;
	export const RC_FOR_TARGET: string;
	export const STRIP: string;
	export const XCURSOR_THEME: string;
	export const XDG_DATA_DIRS: string;
	export const NIX_GOBJECT_INTROSPECTION_DEFAULT_FALLBACK_LIBPATH: string;
	export const LIBEXEC_PATH: string;
	export const CLAUDE_CODE_EXECPATH: string;
	export const OBJDUMP: string;
	export const PATH: string;
	export const propagatedBuildInputs: string;
	export const dontAddDisableDepTrack: string;
	export const WEBKIT_DISABLE_COMPOSITING_MODE: string;
	export const CC: string;
	export const NIX_CC_FOR_TARGET: string;
	export const NIX_CC: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const depsBuildTargetPropagated: string;
	export const depsBuildBuildPropagated: string;
	export const FZF_DEFAULT_OPTS: string;
	export const DIRENV_WATCHES: string;
	export const NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
	export const QT_PLUGIN_PATH: string;
	export const POWERLINE_COMMAND: string;
	export const GETTEXTDATADIRS_FOR_TARGET: string;
	export const CONFIG_SHELL: string;
	export const __structuredAttrs: string;
	export const RANLIB: string;
	export const NIX_HARDENING_ENABLE: string;
	export const LC_NUMERIC: string;
	export const NIX_USER: string;
	export const WEZTERM_PANE: string;
	export const OLDPWD: string;
	export const FORCE_AUTOUPDATE_PLUGINS: string;
	export const NIX_LDFLAGS: string;
	export const nativeBuildInputs: string;
	export const name: string;
	export const TERM_PROGRAM: string;
	export const depsHostHostPropagated: string;
	export const WEZTERM_EXECUTABLE_DIR: string;
	export const TEST: string;
	export const VITEST: string;
	export const NODE_ENV: string;
	export const PROD: string;
	export const DEV: string;
	export const BASE_URL: string;
	export const MODE: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SHELL: string;
		npm_command: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		PKG_CONFIG_FOR_TARGET: string;
		ZLE_RPROMPT_INDENT: string;
		__ETC_PROFILE_DONE: string;
		OBJDUMP_FOR_TARGET: string;
		__HM_SESS_VARS_SOURCED: string;
		COLORTERM: string;
		HYPRLAND_CMD: string;
		XDG_CONFIG_DIRS: string;
		NIX_LD_LIBRARY_PATH: string;
		NIX_BUILD_CORES: string;
		TERM_PROGRAM_VERSION: string;
		WLR_NO_HARDWARE_CURSORS: string;
		configureFlags: string;
		XDG_BACKEND: string;
		mesonFlags: string;
		ZSH_CACHE_DIR: string;
		shell: string;
		SIZE_FOR_TARGET: string;
		depsHostHost: string;
		WEZTERM_CONFIG_DIR: string;
		NIX_PROJECT_FOLDER: string;
		LC_ADDRESS: string;
		AS_FOR_TARGET: string;
		LC_NAME: string;
		SSH_AUTH_SOCK: string;
		DIRENV_DIR: string;
		npm_config_verify_deps_before_run: string;
		CC_FOR_TARGET: string;
		STRINGS: string;
		depsTargetTarget: string;
		LD_FOR_TARGET: string;
		XCURSOR_PATH: string;
		stdenv: string;
		LOCALE_ARCHIVE_2_27: string;
		PKG_CONFIG_PATH_FOR_TARGET: string;
		PYENV_VIRTUALENV_DISABLE_PROMPT: string;
		builder: string;
		WEZTERM_EXECUTABLE: string;
		LC_MONETARY: string;
		GDK_PIXBUF_MODULE_FILE: string;
		HL_INITIAL_WORKSPACE_TOKEN: string;
		shellHook: string;
		NO_AT_BRIDGE: string;
		NIX_BINTOOLS_FOR_TARGET: string;
		XCURSOR_SIZE: string;
		NIX_LDFLAGS_FOR_TARGET: string;
		DIRENV_FILE: string;
		EDITOR: string;
		phases: string;
		PMSPEC: string;
		FZF_ALT_C_OPTS: string;
		XDG_SEAT: string;
		PWD: string;
		NIX_PROFILES: string;
		SOURCE_DATE_EPOCH: string;
		LOGNAME: string;
		QT_QPA_PLATFORMTHEME: string;
		XDG_SESSION_TYPE: string;
		NIX_ENFORCE_NO_NATIVE: string;
		NIX_BINTOOLS_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
		CUPS_DATADIR: string;
		CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG: string;
		NIX_PATH: string;
		STRIP_FOR_TARGET: string;
		YAZI_CONFIG_HOME: string;
		NIXPKGS_CONFIG: string;
		RANLIB_FOR_TARGET: string;
		CXX: string;
		system: string;
		NoDefaultCurrentDirectoryInExePath: string;
		STRINGS_FOR_TARGET: string;
		POSH_SHELL: string;
		HOST_PATH: string;
		WINDRES_FOR_TARGET: string;
		NIX_PKG_CONFIG_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
		CLAUDECODE: string;
		QT_STYLE_OVERRIDE: string;
		GTK2_RC_FILES: string;
		IN_NIX_SHELL: string;
		GI_TYPELIB_PATH: string;
		doInstallCheck: string;
		HOME: string;
		NIX_BINTOOLS: string;
		GETTEXTDATADIRS: string;
		SSH_ASKPASS: string;
		LC_PAPER: string;
		LANG: string;
		NIXOS_OZONE_WL: string;
		WEZTERM_UNIX_SOCKET: string;
		LS_COLORS: string;
		_JAVA_AWT_WM_NONREPARENTING: string;
		XDG_CURRENT_DESKTOP: string;
		depsTargetTargetPropagated: string;
		POSH_SHELL_VERSION: string;
		NH_FLAKE: string;
		POSH_SESSION_ID: string;
		WAYLAND_DISPLAY: string;
		cmakeFlags: string;
		SSL_CERT_DIR: string;
		WEBKIT_DISABLE_DMABUF_RENDERER: string;
		VIRTUAL_ENV_DISABLE_PROMPT: string;
		outputs: string;
		GIO_EXTRA_MODULES: string;
		OSTYPE: string;
		CONDA_PROMPT_MODIFIER: string;
		NIX_STORE: string;
		NIX_FOLDER: string;
		NIX_CFLAGS_COMPILE_FOR_TARGET: string;
		READELF_FOR_TARGET: string;
		LD: string;
		buildPhase: string;
		pnpm_config_verify_deps_before_run: string;
		AR_FOR_TARGET: string;
		RUST_SRC_PATH: string;
		DIRENV_DIFF: string;
		READELF: string;
		GTK_A11Y: string;
		NIX_USER_PROFILE_DIR: string;
		INFOPATH: string;
		doCheck: string;
		depsBuildBuild: string;
		ZPFX: string;
		TERM: string;
		LC_IDENTIFICATION: string;
		DISABLE_INSTALLATION_CHECKS: string;
		GTK_PATH: string;
		SIZE: string;
		propagatedNativeBuildInputs: string;
		ZDOTDIR: string;
		strictDeps: string;
		USER: string;
		NIX_CC_WRAPPER_TARGET_TARGET_x86_64_unknown_linux_gnu: string;
		TZDIR: string;
		NIX_LD: string;
		FZF_CTRL_T_OPTS: string;
		AR: string;
		AS: string;
		HYPRLAND_INSTANCE_SIGNATURE: string;
		VISUAL: string;
		NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
		DISPLAY: string;
		SHLVL: string;
		MOZ_ENABLE_WAYLAND: string;
		CXX_FOR_TARGET: string;
		NM: string;
		GIT_EDITOR: string;
		__HM_ZSH_SESS_VARS_SOURCED: string;
		PAGER: string;
		NIX_CFLAGS_COMPILE: string;
		LC_TELEPHONE: string;
		QTWEBKIT_PLUGIN_PATH: string;
		patches: string;
		LC_MEASUREMENT: string;
		__NIXOS_SET_ENVIRONMENT_DONE: string;
		XDG_VTNR: string;
		buildInputs: string;
		XDG_SESSION_ID: string;
		preferLocalBuild: string;
		LOCALE_ARCHIVE: string;
		LESSKEYIN_SYSTEM: string;
		npm_config_user_agent: string;
		QML2_IMPORT_PATH: string;
		TERMINFO_DIRS: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		GSETTINGS_SCHEMAS_PATH: string;
		LD_LIBRARY_PATH: string;
		DISABLE_AUTOUPDATER: string;
		WEZTERM_CONFIG_FILE: string;
		XDG_RUNTIME_DIR: string;
		SSL_CERT_FILE: string;
		NM_FOR_TARGET: string;
		OBJCOPY_FOR_TARGET: string;
		NODE_PATH: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		depsBuildTarget: string;
		OBJCOPY: string;
		NIX_XDG_DESKTOP_PORTAL_DIR: string;
		out: string;
		LC_TIME: string;
		RC_FOR_TARGET: string;
		STRIP: string;
		XCURSOR_THEME: string;
		XDG_DATA_DIRS: string;
		NIX_GOBJECT_INTROSPECTION_DEFAULT_FALLBACK_LIBPATH: string;
		LIBEXEC_PATH: string;
		CLAUDE_CODE_EXECPATH: string;
		OBJDUMP: string;
		PATH: string;
		propagatedBuildInputs: string;
		dontAddDisableDepTrack: string;
		WEBKIT_DISABLE_COMPOSITING_MODE: string;
		CC: string;
		NIX_CC_FOR_TARGET: string;
		NIX_CC: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		depsBuildTargetPropagated: string;
		depsBuildBuildPropagated: string;
		FZF_DEFAULT_OPTS: string;
		DIRENV_WATCHES: string;
		NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
		QT_PLUGIN_PATH: string;
		POWERLINE_COMMAND: string;
		GETTEXTDATADIRS_FOR_TARGET: string;
		CONFIG_SHELL: string;
		__structuredAttrs: string;
		RANLIB: string;
		NIX_HARDENING_ENABLE: string;
		LC_NUMERIC: string;
		NIX_USER: string;
		WEZTERM_PANE: string;
		OLDPWD: string;
		FORCE_AUTOUPDATE_PLUGINS: string;
		NIX_LDFLAGS: string;
		nativeBuildInputs: string;
		name: string;
		TERM_PROGRAM: string;
		depsHostHostPropagated: string;
		WEZTERM_EXECUTABLE_DIR: string;
		TEST: string;
		VITEST: string;
		NODE_ENV: string;
		PROD: string;
		DEV: string;
		BASE_URL: string;
		MODE: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
