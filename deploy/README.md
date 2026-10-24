# Frontend CI/CD

These files were imported from `portfolio-cicd-dockerhub.zip` and adapted to this repository. The production target is native Node 24 with systemd on Ubuntu. The existing frontend Dockerfile remains an alternative manual deployment; this workflow does not build or restart a frontend container.

Pull requests to `main` run the frozen Bun install, TypeScript checks, unit tests, and the Vite/Nitro SSR build. Pushes to `main` and manual runs on `main` can additionally upload `.output/` and restart the existing frontend service when `FRONTEND_DEPLOY_ENABLED=true`.

## GitHub settings

In `Adnank999/ad-portfolio-frontend`, open **Settings > Secrets and variables > Actions**.

| Repository secret | Value |
| --- | --- |
| `VPS_HOST` | VPS SSH hostname or IP |
| `VPS_USER` | Existing SSH account, for example `root` |
| `VPS_SSH_KEY` | Dedicated deployment private key in OpenSSH format |
| `VPS_KNOWN_HOSTS` | Verified SSH host-key entry for that hostname/IP and port |

| Repository variable | Default or required value |
| --- | --- |
| `FRONTEND_DEPLOY_ENABLED` | Set `false` initially; set `true` after server setup and passing CI |
| `VPS_SSH_PORT` | `22` |
| `FRONTEND_APP_DIR` | `/root/apps/ad-portfolio-frontend` |
| `FRONTEND_SERVICE` | `ad-portfolio-frontend` |
| `FRONTEND_HEALTH_URL` | `http://127.0.0.1:3000/` |

Verify the SSH host-key fingerprint through your existing trusted server session before adding `VPS_KNOWN_HOSTS`. A custom SSH port needs the corresponding `[hostname]:port` known-hosts entry. Keep the private key in GitHub Secrets and put only its public key in the server account's `authorized_keys`.

## Ubuntu prerequisites

The app directory, service, and private environment must already exist. Check the real settings before enabling deployment:

```bash
systemctl cat ad-portfolio-frontend
systemctl is-active ad-portfolio-frontend
node --version
command -v rsync curl flock
```

The service must use the stable output path and private environment file. The guide's default command is:

```text
node --env-file=/root/apps/ad-portfolio-frontend/.env.production /root/apps/ad-portfolio-frontend/.output/server/index.mjs
```

The deployment account needs write access to the app directory and permission to restart/check the service. Root works with the guide's defaults. For a different SSH account, the activation script uses `sudo -n systemctl`; configure the required noninteractive service permissions and directory ownership beforehand.

Keep `APP_ORIGIN`, `PORTFOLIO_API_URL`, R2 credentials, and all other runtime secrets in the existing VPS `.env.production`. The workflow never uploads or replaces that file. This app currently uses server-side API calls, so the workflow does not require a public `VITE_API_URL` variable. The CI Bun version is pinned to the locally tested `1.4.0`.

Preserve your existing Nginx configuration and take protected backups of the current output, service unit, and private configuration before the first deployment. For the root-owned paths in the supplied guide, the service must already be able to read files under `/root`.

## Release activation

Every deployment gets a separate `.deploy/releases/COMMIT-RUN-ATTEMPT/.output/` directory. Rerunning a workflow does not overwrite the active release's assets. The script serializes activation with `flock`, preserves the initial manually built output, switches `.output` to a release symlink, restarts systemd, and checks the service and HTTP response. Restart or health-check failures restore the previous output and restart it; the workflow still reports failure.

Old releases are retained for manual rollback. No release pruning is automated. The app may briefly be unavailable during a systemd restart; this is not a blue/green deployment.

To activate a retained release manually, run on the VPS from a checkout containing this script:

```bash
bash deploy/activate-frontend.sh COMMIT-RUN-ATTEMPT /root/apps/ad-portfolio-frontend ad-portfolio-frontend http://127.0.0.1:3000/
```

Replace `COMMIT-RUN-ATTEMPT` with an existing release directory name. The script also accepts a legacy 40-character commit-only release name from the original ZIP.

## First activation

1. Confirm the actual server paths and service name and set any variable overrides.
2. Add the four SSH secrets and keep `FRONTEND_DEPLOY_ENABLED=false`.
3. Push the reviewed files to `main` and wait for passing CI.
4. Verify SSH access, runtime configuration, and the current service on Ubuntu.
5. Set `FRONTEND_DEPLOY_ENABLED=true` and run the workflow on `main`.
6. Check the page, assets, sign-in, public content, and `journalctl -u ad-portfolio-frontend`.

No server has been changed by installing these repository files.

References: [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions), and [Bun setup action](https://github.com/oven-sh/setup-bun).
