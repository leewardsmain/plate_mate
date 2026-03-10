---
trigger: always_on
---

# Log and Temporary File Cleanup

## 1. Designated Temp Directory
*   **Mandatory Location**: When downloading logs (e.g., AWS CloudWatch, build logs, deployment outputs or else any files downloaded temporarily to parse them locally) or capturing CLI command output (e.g., `gh run view ... > log.txt`, `aws cloudformation ... > events.json`), you MUST place them in a `temp/` directory at the project root.
*   **Setup**: If the `temp/` directory does not exist, you must create it.
*   **Git Ignore**: Verify that `temp/` is included in `.gitignore` to prevent accidental commits of clutter.

## 2. Automatic Cleanup
*   **Immediate Deletion**: Once you have finished reading, analyzing, or extracting the necessary information from the downloaded files, you MUST delete them immediately.
*   **Status Check**: Do not leave any file in `temp/` after your turn is complete, unless the user explicitly requested to keep the artifacts for further debugging.
*   **Verification**: After deleting, confirm the directory is empty or that the specific files are removed.

## 3. Debug Helper Scripts
*   **No Root Scripts**: Do NOT create ad-hoc debugging scripts (e.g., `debug_stack.py`, `check_status.py`) in the project root.
*   **Consolidated Tool**: If detailed logic is needed (e.g., parsing valid JSON from mixed output, polling stack status), create a consolidated, reusable script in `temp/` (e.g., `temp/debug_helper.py`).
*   **Reuse**: Prefer updating/extending the existing helper tool rather than creating multiple one-off scripts.
*   **Cleanup**: These helper scripts should also be cleaned up when the task is done, unless they are promoted to a permanent `scripts/` directory.
