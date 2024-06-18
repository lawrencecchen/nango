#!/bin/bash

# This script adds .js extensions to local import statements in TypeScript files.
# It excludes the node_modules directory.

find . -type f -name "*.ts" ! -path "./node_modules/*" -print0 | while IFS= read -r -d '' file; do
    sed -i "s/\(import.*from\s*['\"][.][^'\"]*\)\(['\"]\)/\1.js\2/g" "$file"
    sed -i "s/\(export.*from\s*['\"][.][^'\"]*\)\(['\"]\)/\1.js\2/g" "$file"
done
