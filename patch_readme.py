import re

with open('README.md', 'r') as f:
    content = f.read()

progress_before = "- Finish migrating the UI scripts (e.g. `popup.js` and `content.js`) to TypeScript to complete the Phase 1 TypeScript migration for the Extension."
progress_after = "- Finish migrating the UI scripts (e.g. `popup.js` and `content.js`) to TypeScript to complete the Phase 1 TypeScript migration for the Extension."

# I'll just append to Progress and remove from Next Tasks
content = content.replace(
    "- Finish migrating the UI scripts (e.g. `popup.js` and `content.js`) to TypeScript to complete the Phase 1 TypeScript migration for the Extension.",
    ""
)

# And add to progress:
content = content.replace(
    "**Progress**:\n",
    "**Progress**:\n- Migrated Extension UI scripts (`popup.ts`, `content.ts`) to TypeScript and reconstructed `vault-service.ts`, completing Phase 1 TypeScript migration. Emitted `.js` files are now properly ignored in version control.\n"
)

with open('README.md', 'w') as f:
    f.write(content)
