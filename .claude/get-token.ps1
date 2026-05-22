$env:GCM_INTERACTIVE = "never"
"protocol=https`nhost=github.com" | git credential-manager get 2>&1
